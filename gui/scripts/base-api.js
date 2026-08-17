/**
 * [INPUT]: 依赖浏览器 fetch/location/history/visibility 与只读同源 /_api/base；允许测试注入 fetch、clock 和 document
 * [OUTPUT]: 通过 globalThis.FitnessBaseApi 提供 token 消费、结构化错误、跨 revision 原子分页与可暂停轮询客户端
 * [POS]: gui/scripts 的唯一 Base 数据端口；其它 GUI 模块不得直接 fetch 或持久化 token
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */

/* global AbortController, URLSearchParams */

(function exposeBaseApi(global) {
  "use strict";

  class BaseApiError extends Error {
    constructor(status, message) {
      super(message);
      this.name = "BaseApiError";
      this.status = status;
    }
  }

  function consumeToken(locationLike, historyLike) {
    const params = new URLSearchParams(String(locationLike.hash || "").replace(/^#/, ""));
    const token = params.get("baseToken") || "";
    historyLike.replaceState(null, "", `${locationLike.pathname}${locationLike.search}`);
    return token;
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
      this.timer = null;
      this.revision = null;
    }

    async request(path, signal) {
      const response = await this.fetch(path, {
        method: "GET",
        headers: { Authorization: `Bearer ${this.token}` },
        signal,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new BaseApiError(response.status, body.error || `Base API ${response.status}`);
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
          if (end.revision !== start.revision) throw new BaseApiError(409, "Base revision 在尾部复核时变化");
          this.revision = end.revision;
          return { meta: end, rows };
        } catch (error) {
          if (!(error instanceof BaseApiError) || error.status !== 409 || attempt === delays.length) throw error;
          await this.clock.sleep(delays[attempt]);
        }
      }
      throw new BaseApiError(409, "Base 持续变化，请稍后重试");
    }

    startPolling(onSnapshot, onError, interval = 5000) {
      this.stopPolling();
      const tick = async () => {
        if (this.document.hidden) return this.schedule(tick, interval);
        try {
          const meta = await this.meta(new AbortController().signal);
          if (meta.revision !== this.revision) onSnapshot(await this.refresh());
        } catch (error) {
          onError(error);
        }
        this.schedule(tick, interval);
      };
      const visible = () => {
        if (!this.document.hidden) void tick();
      };
      this.visibilityHandler = visible;
      this.document.addEventListener("visibilitychange", visible);
      this.schedule(tick, interval);
      return () => this.stopPolling();
    }

    schedule(callback, delay) {
      if (this.timer !== null) this.clock.clearTimeout(this.timer);
      this.timer = this.clock.setTimeout(callback, delay);
    }

    stopPolling() {
      if (this.timer !== null) this.clock.clearTimeout(this.timer);
      this.timer = null;
      if (this.visibilityHandler) this.document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
      if (this.abort) this.abort.abort();
      this.abort = null;
    }
  }

  global.FitnessBaseApi = { BaseApiError, Client, consumeToken };
})(globalThis);
