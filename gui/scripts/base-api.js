/**
 * [INPUT]: 依赖浏览器 fetch/location/history/visibility 与同源 /_api/base；允许测试注入 fetch、clock 和 document
 * [OUTPUT]: 通过 globalThis.FitnessBaseApi 提供 fragment 一次性消费、structured error、instance+revision 原子分页、batch row insert 与健康轮询
 * [POS]: gui/scripts 的唯一 Base 数据端口；其它 GUI 模块不得直接 fetch 或持久化 token，200 后 refresh 由提交状态机收口
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */

/* global AbortController, URLSearchParams */

(function exposeBaseApi(global) {
  "use strict";

  class BaseApiError extends Error {
    constructor(status, message, details) {
      super(message);
      this.name = "BaseApiError";
      this.status = status;
      Object.assign(this, details || {});
    }
  }

  /* fragment 一次性消费：token 与宿主语言一起取走，再把 hash 抹掉。
     分两次读会让第二次拿到空——所以这里只暴露一个出口。 */
  function consumeFragment(locationLike, historyLike) {
    const params = new URLSearchParams(String(locationLike.hash || "").replace(/^#/, ""));
    const fragment = { token: params.get("baseToken") || "", lang: params.get("lang") || "" };
    historyLike.replaceState(null, "", `${locationLike.pathname}${locationLike.search}`);
    return fragment;
  }

  class Client {
    constructor(options) {
      this.token = options.token;
      this.fetch = options.fetch || global.fetch.bind(global);
      this.document = options.document || global.document;
      this.clock = options.clock || {
        setTimeout: global.setTimeout.bind(global),
        clearTimeout: global.clearTimeout.bind(global),
        sleep: (milliseconds) => new Promise((resolve) => global.setTimeout(resolve, milliseconds)),
      };
      this.abort = null;
      this.pollAbort = null;
      this.pollingSession = null;
      this.timer = null;
      this.revision = null;
      this.baseInstanceId = null;
    }

    async request(path, signal, init) {
      const response = await this.fetch(path, {
        method: init && init.method || "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          ...(init && init.body ? { "Content-Type": "application/json" } : {}),
        },
        ...(init && init.body ? { body: JSON.stringify(init.body) } : {}),
        signal,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = body.error && typeof body.error === "object" ? body.error : {};
        throw new BaseApiError(response.status, error.message || body.error || `Base API ${response.status}`, {
          code: error.code || "unknown_error",
          outcome: error.outcome || (response.status >= 500 ? "unknown" : "not-committed"),
          issues: error.issues || [],
          currentRevision: error.currentRevision,
          retryAfter: response.headers && response.headers.get ? response.headers.get("retry-after") : null,
        });
      }
      return body;
    }

    async meta(signal) {
      return this.request("/_api/base/meta", signal);
    }

    async refresh() {
      if (this.abort) this.abort.abort();
      const abort = new AbortController();
      this.abort = abort;
      try {
        return await this.readConsistent(abort.signal);
      } finally {
        if (this.abort === abort) this.abort = null;
      }
    }

    async readConsistent(signal) {
      const delays = [250, 500, 1000];
      for (let attempt = 0; attempt <= delays.length; attempt += 1) {
        try {
          const start = await this.meta(signal);
          const rows = [];
          let cursor = "";
          do {
            const query = new URLSearchParams({ limit: "500" });
            if (cursor) query.set("cursor", cursor);
            const page = await this.request(`/_api/base/rows?${query}`, signal);
            if (page.revision !== start.revision) throw new BaseApiError(409, "Base revision 在分页期间变化");
            rows.push(...page.rows);
            cursor = page.nextCursor || "";
          } while (cursor);
          const end = await this.meta(signal);
          if (end.revision !== start.revision || end.baseInstanceId !== start.baseInstanceId) {
            throw new BaseApiError(409, "Base instance/revision 在尾部复核时变化", { code: "snapshot_changed", outcome: "not-committed" });
          }
          this.revision = end.revision;
          this.baseInstanceId = end.baseInstanceId;
          return { meta: end, rows };
        } catch (error) {
          if (!(error instanceof BaseApiError) || error.status !== 409 || attempt === delays.length) throw error;
          await this.clock.sleep(delays[attempt]);
        }
      }
      throw new BaseApiError(409, "Base 持续变化，请稍后重试");
    }

    insertRows(frozen, expectedRevision, signal) {
      return this.request("/_api/base/rows", signal, {
        method: "POST",
        body: {
          expectedBaseInstanceId: frozen.expectedBaseInstanceId,
          expectedRevision,
          rows: frozen.rows,
        },
      });
    }

    startPolling(onSnapshot, onError, interval = 5000) {
      this.stopPolling();
      const session = { active: true, inFlight: false, unhealthy: false };
      this.pollingSession = session;
      const isActive = () => this.pollingSession === session && session.active;
      const schedule = () => {
        if (!isActive()) return;
        if (this.timer !== null) this.clock.clearTimeout(this.timer);
        this.timer = this.clock.setTimeout(() => {
          this.timer = null;
          return tick();
        }, interval);
      };
      const tick = async () => {
        if (!isActive() || session.inFlight) return;
        if (this.document.hidden) return schedule();
        session.inFlight = true;
        const pollAbort = new AbortController();
        this.pollAbort = pollAbort;
        try {
          const meta = await this.meta(pollAbort.signal);
          if (!isActive()) return;
          if (meta.revision !== this.revision || session.unhealthy) {
            onSnapshot(await this.refresh());
          }
          session.unhealthy = false;
        } catch (error) {
          if (!isActive() || isAbortError(error)) return;
          onError(error);
          if (isFatalError(error)) {
            this.stopPolling();
            return;
          }
          session.unhealthy = true;
        } finally {
          if (this.pollAbort === pollAbort) this.pollAbort = null;
          session.inFlight = false;
          if (isActive()) schedule();
        }
      };
      const visible = () => {
        if (this.document.hidden || !isActive() || session.inFlight) return;
        if (this.timer !== null) this.clock.clearTimeout(this.timer);
        this.timer = null;
        void tick();
      };
      this.visibilityHandler = visible;
      this.document.addEventListener("visibilitychange", visible);
      schedule();
      return () => {
        if (this.pollingSession === session) this.stopPolling();
      };
    }

    stopPolling() {
      if (this.pollingSession) this.pollingSession.active = false;
      this.pollingSession = null;
      if (this.timer !== null) this.clock.clearTimeout(this.timer);
      this.timer = null;
      if (this.visibilityHandler) this.document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
      if (this.pollAbort) this.pollAbort.abort();
      this.pollAbort = null;
      if (this.abort) this.abort.abort();
      this.abort = null;
    }
  }

  function isAbortError(error) {
    return error instanceof Error && error.name === "AbortError";
  }

  function isFatalError(error) {
    return error instanceof BaseApiError && [401, 403, 404, 410].includes(error.status);
  }

  global.FitnessBaseApi = { BaseApiError, Client, consumeFragment };
})(globalThis);
