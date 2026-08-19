/**
 * [INPUT]: 依赖 FitnessI18n/BaseApi/Catalog/MuscleStats/PlanBuilder/PlanSubmission、index DOM 与本地 JSON/GIF
 * [OUTPUT]: 编排语言、人体热力图/目录、原子 Base 快照，以及可访问的多动作 planned batch dialog 与 unknown-outcome 恢复
 * [POS]: gui/scripts 的浏览器组合根；零外网，Base 只经 BaseApi，fitness 语义只经 PlanBuilder
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */

/* global Option, crypto, document, fetch, navigator */

(function startFitnessGui(global) {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const state = {
    exercises: [], regions: [], labels: new Map(), bodyMap: null,
    gender: "male", snapshot: null, analysis: null, selectedMuscle: "", visible: 24,
    locale: "en", t: (key) => key,
    client: null, planController: null, planAttempt: null, planTrigger: null,
  };

  document.addEventListener("DOMContentLoaded", () => void boot());

  async function boot() {
    const fragment = global.FitnessBaseApi.consumeFragment(global.location, global.history);
    applyLocale(fragment.lang || navigator.language);
    bindControls();
    try {
      if (!fragment.token) throw new global.FitnessBaseApi.BaseApiError(401, state.t("error.401"));
      const [exercises, regions, bodyMap] = await Promise.all([
        loadJson("./data/exercises.json"), loadJson("./data/muscle-regions.json"), loadJson("./data/body-map.json"),
      ]);
      state.exercises = exercises;
      state.regions = regions;
      state.bodyMap = bodyMap;
      applyLabels();
      renderBodyMaps();
      populateFilters();
      renderCatalog();
      const client = new global.FitnessBaseApi.Client({ token: fragment.token });
      state.client = client;
      state.planController = new global.FitnessPlanSubmission.Controller({
        api: client,
        onState: renderPlanState,
        validateRetry: (attempt, snapshot) => {
          global.FitnessPlanBuilder.assertNoPlannedDuplicate(
            snapshot.rows,
            attempt.frozen.date,
            attempt.frozen.rows.map((row) => row.values.exercise_id)
          );
        },
      });
      publish(await client.refresh());
      const restored = state.planController.restore();
      if (restored) {
        state.planAttempt = restored;
        state.planTrigger = $("#create-plan");
        renderFrozenPlan(restored);
        void state.planController.reconcileAttempt(restored);
      }
      client.startPolling(publish, (error) => showError(error, true));
      global.addEventListener("beforeunload", () => client.stopPolling(), { once: true });
    } catch (error) {
      showError(error, false);
    }
  }

  async function loadJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(state.t("error.resource", { path }));
    return response.json();
  }

  /* ------------------------------------------------------------------- i18n
     宿主把有效语言塞进 fragment；独立打开时退回浏览器语言。文案键位写在
     HTML 上，这里只做一次遍历填充——渲染函数拿到的永远是已协商的 t()。 */
  function applyLocale(tag) {
    state.locale = global.FitnessI18n.resolve(tag);
    state.t = global.FitnessI18n.translator(state.locale);
    document.documentElement.lang = state.locale;
    document.title = state.t("app.title");
    fill("data-i18n", (node, value) => { node.textContent = value; });
    fill("data-i18n-placeholder", (node, value) => node.setAttribute("placeholder", value));
    fill("data-i18n-aria", (node, value) => node.setAttribute("aria-label", value));
    renderMusclePlaceholder();
  }

  function fill(attribute, apply) {
    document.querySelectorAll(`[${attribute}]`).forEach((node) => {
      apply(node, state.t(node.getAttribute(attribute)));
    });
  }

  function applyLabels() {
    state.labels = new Map(state.regions.map((region) => [region.id, region.labels[state.locale] || region.labels.en]));
    $("#catalog-eyebrow").textContent = state.t("catalog.eyebrow", { n: state.exercises.length });
    $("#media-credit").textContent = state.exercises[0].media.attribution;
  }

  /* --------------------------------------------------------------- body map
     几何来自生成器固化的 body-map.json：outline 是人形轮廓，figure 是头发/手足
     等纯装饰件（永不接收热度），zone 是 17 个 canonical 区域的可聚焦分组。
     命名空间取自 HTML 里已有的 <svg>，省得在脚本里写死一个 URL 常量。 */
  function renderBodyMaps() {
    const model = state.bodyMap.genders[state.gender];
    document.querySelectorAll("[data-view]").forEach((svg) => {
      const box = model.viewBox[svg.dataset.view];
      const view = model.views[svg.dataset.view];
      const [, , width, height] = box.split(" ");
      svg.replaceChildren();
      svg.setAttribute("viewBox", box);
      svg.style.aspectRatio = `${width} / ${height}`;
      svg.append(shape(svg, "path", { class: "outline", d: view.outline }));
      svg.append(group(svg, "figure", view.figure.map((d) => shape(svg, "path", { d }))));
      view.zones.forEach((zone) => svg.append(zoneGroup(svg, zone)));
    });
    if (state.analysis) renderHeat();
  }

  function zoneGroup(svg, zone) {
    const node = group(svg, "zone", zone.paths.map((d) => shape(svg, "path", { d })));
    node.dataset.muscle = zone.id;
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "button");
    node.setAttribute("aria-label", state.labels.get(zone.id) || zone.id);
    node.addEventListener("click", () => renderMuscleDetail(zone.id));
    node.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      renderMuscleDetail(zone.id);
    });
    return node;
  }

  function group(svg, className, children) {
    const node = shape(svg, "g", { class: className });
    children.forEach((child) => node.append(child));
    return node;
  }

  function shape(svg, tag, attributes) {
    const node = document.createElementNS(svg.namespaceURI, tag);
    Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
    return node;
  }

  /* --------------------------------------------------------------- analysis */
  function publish(snapshot) {
    state.snapshot = snapshot;
    $("#revision").textContent = String(snapshot.meta.revision);
    const issues = global.FitnessMuscleStats.validateColumns(snapshot.meta.columns);
    $("#status").className = issues.length ? "status error" : "status";
    $("#status").textContent = issues.length
      ? state.t("status.schema", { issues: issues.map((issue) => `${issue.id}(${issue.reason})`).join(", ") })
      : state.t("status.ok", { n: snapshot.rows.length });
    const planIssues = global.FitnessPlanBuilder.validatePlanSchema(snapshot.meta);
    const canInsert = snapshot.meta.capabilities && snapshot.meta.capabilities.rowInsert;
    $("#create-plan").disabled = !canInsert || planIssues.length > 0;
    $("#create-plan").title = !canInsert
      ? state.t("plan.disabled.readonly")
      : planIssues.length ? state.t("plan.disabled.schema") : "";
    calculate();
  }

  function calculate() {
    if (!state.snapshot || !state.exercises.length) return;
    state.analysis = global.FitnessMuscleStats.analyzeRows(
      state.snapshot.rows, state.exercises, $("#range").value, new Date()
    );
    renderHeat();
    if (state.selectedMuscle) renderMuscleDetail(state.selectedMuscle);
  }

  function renderHeat() {
    document.querySelectorAll("[data-muscle]").forEach((element) => {
      const muscle = element.dataset.muscle;
      const score = state.analysis.scores[muscle] || 0;
      const intensity = global.FitnessMuscleStats.intensity(score);
      const level = intensity === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(intensity * 4)));
      element.dataset.level = String(level);
      element.setAttribute("aria-label", `${state.labels.get(muscle) || muscle} ${score.toFixed(1)}`);
      element.classList.toggle("selected", muscle === state.selectedMuscle);
    });
  }

  function renderMusclePlaceholder() {
    $("#muscle-detail").innerHTML = `<h3>${escapeHtml(state.t("map.pick"))}</h3><p>${escapeHtml(state.t("map.pickHint"))}</p>`;
  }

  function renderMuscleDetail(muscle) {
    state.selectedMuscle = muscle;
    if (!state.analysis) return;
    renderHeat();
    const score = state.analysis.scores[muscle] || 0;
    const items = state.analysis.contributions[muscle] || [];
    const totalSets = items.reduce((sum, item) => sum + item.sets, 0);
    const uniqueRows = new Set(items.map((item) => item.rowId)).size;
    const rows = items.length
      ? `<ol>${items.slice(0, 8).map((item) =>
          `<li>${escapeHtml(label(exerciseName(item.exerciseId)))}${escapeHtml(state.t("map.setsUnit", { n: item.sets }))}, ${escapeHtml(state.t("map.contribution", { n: item.points.toFixed(1) }))}</li>`
        ).join("")}</ol>`
      : `<p>${escapeHtml(state.t("map.noRows"))}</p>`;
    $("#muscle-detail").innerHTML =
      `<h3>${escapeHtml(state.labels.get(muscle) || muscle)}</h3>` +
      `<p>${escapeHtml(state.t("map.score"))} <strong>${score.toFixed(1)}</strong> · ` +
      `${escapeHtml(state.t("map.sets"))} ${totalSets} · ${escapeHtml(state.t("map.records"))} ${uniqueRows}</p>${rows}`;
  }

  /* ---------------------------------------------------------------- catalog */
  function bindControls() {
    $("#range").addEventListener("change", calculate);
    $("#gender").addEventListener("change", () => { state.gender = $("#gender").value; renderBodyMaps(); });
    ["#query", "#body-filter", "#muscle-filter", "#equipment-filter"].forEach((selector) => {
      $(selector).addEventListener(selector === "#query" ? "input" : "change", () => { state.visible = 24; renderCatalog(); });
    });
    $("#clear").addEventListener("click", () => {
      ["#query", "#body-filter", "#muscle-filter", "#equipment-filter"].forEach((selector) => { $(selector).value = ""; });
      state.visible = 24;
      renderCatalog();
    });
    $("#more").addEventListener("click", () => { state.visible += 24; renderCatalog(); });
    $(".dialog-close").addEventListener("click", () => $("#exercise-dialog").close());
    $("#create-plan").addEventListener("click", openPlan);
    $("#plan-add").addEventListener("click", () => addPlanRow());
    $("#plan-close").addEventListener("click", closePlan);
    $("#plan-cancel").addEventListener("click", closePlan);
    $("#plan-dialog").addEventListener("cancel", (event) => {
      event.preventDefault();
      closePlan();
    });
    /* iframe 刻意没有 allow-forms：Chromium 会在原生 form submit 前拦截，
       因而保存按钮必须直接进入 JS command，再由 fetch 完成同源写入。 */
    $("#plan-save").addEventListener("click", submitPlan);
    $("#plan-form").addEventListener("submit", submitPlan);
    $("#plan-form").addEventListener("input", () => {
      if (state.planAttempt && ["draft", "editable-error", "retry-ready"].includes(state.planAttempt.state)) {
        state.planAttempt = null;
        state.planController.clear();
      }
    });
  }

  /* ---------------------------------------------------------- plan builder */
  function openPlan(event) {
    if (!state.snapshot || !state.client || $("#create-plan").disabled) return;
    state.planTrigger = event.currentTarget;
    /* frozen ids 是 unknown-outcome 的唯一证据；重开只能恢复，不能把它当草稿清空。 */
    if (state.planAttempt) {
      renderFrozenPlan(state.planAttempt);
      renderPlanState(state.planAttempt);
      return;
    }
    state.planAttempt = null;
    state.planController.clear();
    $("#plan-date").value = global.FitnessPlanBuilder.localDate(new Date());
    $("#plan-list").replaceChildren();
    addPlanRow();
    $("#plan-error").textContent = "";
    $("#plan-form").setAttribute("aria-busy", "false");
    setPlanLocked(false);
    $("#plan-dialog").showModal();
    $("#plan-date").focus();
  }

  function addPlanRow(selectedId, values) {
    const row = $("#plan-row-template").content.firstElementChild.cloneNode(true);
    const select = row.querySelector("select");
    const search = row.querySelector(".plan-exercise-search");
    const populate = () => {
      const query = search.value.trim().toLocaleLowerCase();
      const current = select.value || selectedId || "";
      select.replaceChildren(new Option(state.t("plan.choose"), ""));
      state.exercises
        .filter((exercise) =>
          !query || `${exercise.name} ${(exercise.aliases || []).join(" ")}`.toLocaleLowerCase().includes(query) || exercise.id === current
        )
        .forEach((exercise) => select.add(new Option(displayName(exercise), exercise.id)));
      select.value = current;
    };
    search.addEventListener("input", populate);
    populate();
    row.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = state.t(node.getAttribute("data-i18n"));
    });
    row.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.setAttribute("placeholder", state.t(node.getAttribute("data-i18n-placeholder")));
    });
    if (values) {
      row.querySelector(".plan-sets").value = String(values.sets);
      row.querySelector(".plan-weight").value = String(values.weight);
    }
    row.querySelector(".plan-remove").addEventListener("click", () => {
      if ($("#plan-list").children.length > 1) row.remove();
    });
    $("#plan-list").append(row);
  }

  function renderFrozenPlan(attempt) {
    $("#plan-date").value = attempt.frozen.date;
    $("#plan-list").replaceChildren();
    attempt.frozen.rows.forEach((row) =>
      addPlanRow(row.values.exercise_id, row.values)
    );
    $("#plan-error").textContent = "";
    if (!$("#plan-dialog").open) $("#plan-dialog").showModal();
    $("#plan-date").focus();
  }

  function closePlan() {
    if (state.planAttempt && [
      "submitting", "reconciling", "committed-refreshing",
      "hard-conflict", "committed-refresh-failed",
    ].includes(state.planAttempt.state)) {
      $("#plan-error").textContent = state.t("plan.busyClose");
      state.planController.save(state.planAttempt);
      return;
    }
    $("#plan-dialog").close();
    state.planTrigger && state.planTrigger.focus();
  }

  async function submitPlan(event) {
    event.preventDefault();
    if (!state.snapshot || !state.planController) return;
    try {
      if (!state.planAttempt) {
        const items = [...document.querySelectorAll(".plan-row")].map((row) => ({
          exerciseId: row.querySelector("select").value,
          sets: Number(row.querySelector(".plan-sets").value),
          weight: Number(row.querySelector(".plan-weight").value),
        }));
        const frozen = global.FitnessPlanBuilder.freezePlan({
          meta: state.snapshot.meta,
          rows: state.snapshot.rows,
          exercises: state.exercises,
          date: $("#plan-date").value,
          items,
          randomUUID: () => crypto.randomUUID(),
        });
        state.planAttempt = global.FitnessPlanSubmission.createAttempt(
          frozen,
          state.snapshot.meta.revision
        );
      }
      await state.planController.submit(state.planAttempt);
    } catch (error) {
      $("#plan-error").textContent = planError(error);
      const field = error && error.field;
      if (field === "date") $("#plan-date").focus();
      const item = /^items\.(\d+)\.(.+)$/.exec(field || "");
      if (item) {
        const row = $("#plan-list").children[Number(item[1])];
        row && row.querySelector(item[2] === "exerciseId" ? "select" : `.plan-${item[2]}`)?.focus();
      }
    }
  }

  function renderPlanState(attempt) {
    state.planAttempt = attempt;
    const busy = ["submitting", "retry-wait", "reconciling", "committed-refreshing"].includes(attempt.state);
    const locked = busy || ["hard-conflict", "committed-refresh-failed"].includes(attempt.state);
    $("#plan-form").setAttribute("aria-busy", String(busy));
    setPlanLocked(locked);
    $("#plan-save").textContent = state.t(`plan.state.${attempt.state}`);
    if (attempt.state === "done") {
      publish(attempt.snapshot);
      const summary = attempt.frozen.summary;
      $("#plan-announcement").textContent = state.t("plan.success", {
        date: attempt.frozen.date, exercises: summary.exercises, sets: summary.sets,
      });
      $("#plan-dialog").close();
      state.planTrigger && state.planTrigger.focus();
      state.planAttempt = null;
      return;
    }
    if (attempt.state === "committed-refresh-failed") {
      $("#plan-error").textContent = state.t("plan.savedRefreshFailed");
    } else if (attempt.state === "hard-conflict") {
      $("#plan-error").textContent = state.t("plan.hardConflict");
    } else if (attempt.state === "retry-ready") {
      $("#plan-error").textContent = state.t("plan.retryReady");
    } else if (attempt.error) {
      $("#plan-error").textContent = planError(attempt.error);
    }
  }

  function setPlanLocked(locked) {
    $("#plan-form").querySelectorAll("input, select, button").forEach((control) => {
      if (!["plan-close", "plan-cancel"].includes(control.id)) control.disabled = locked;
    });
  }

  function planError(error) {
    const code = error && (error.code || error.message);
    return state.t(`plan.error.${code}`) === `plan.error.${code}`
      ? state.t("plan.error.generic")
      : state.t(`plan.error.${code}`);
  }

  function populateFilters() {
    addOptions("#body-filter", unique(state.exercises.map((item) => item.body_part)).map(self));
    addOptions("#muscle-filter", state.regions.map((region) => [state.labels.get(region.id), region.id]));
    addOptions("#equipment-filter", unique(state.exercises.map((item) => item.equipment)).map(self));
  }

  function addOptions(selector, entries) {
    const select = $(selector);
    entries.forEach(([label, value]) => select.add(new Option(label, value)));
  }
  function self(value) { return [value, value]; }

  /* 别名是中文人工命名，只有中文界面该用它；其余语言用上游英文原名。
     标点同理：全角冒号顿号在法/西/英下是排版错误。 */
  function displayName(item) {
    return state.locale === "zh-CN" ? item.aliases[0] || item.name : item.name;
  }
  function exerciseName(id) {
    const item = state.exercises.find((exercise) => exercise.id === id);
    return item ? displayName(item) : id;
  }
  function label(text) { return `${text}${state.t("punct.label")}`; }
  function list(values) { return values.join(state.t("punct.list")); }

  function renderCatalog() {
    if (!state.exercises.length) return;
    const filtered = global.FitnessCatalog.filterExercises(state.exercises, {
      query: $("#query").value, bodyPart: $("#body-filter").value,
      muscle: $("#muscle-filter").value, equipment: $("#equipment-filter").value,
    });
    const visible = filtered.slice(0, state.visible);
    $("#result-count").textContent = state.t("catalog.count", { n: filtered.length });
    $("#more").hidden = visible.length >= filtered.length;
    $("#catalog").innerHTML = visible.length ? global.FitnessCatalog.groupByBodyPart(visible).map(([group, items]) =>
      `<section class="catalog-group"><h3>${escapeHtml(group)}</h3><div class="cards">${items.map(cardHtml).join("")}</div></section>`
    ).join("") : `<p class="empty">${escapeHtml(state.t("catalog.empty"))}</p>`;
    document.querySelectorAll(".card").forEach((button) => button.addEventListener("click", () => openExercise(button.dataset.exerciseId)));
  }

  function cardHtml(item) {
    const secondary = item.secondary_muscles.length ? list(item.secondary_muscles) : state.t("card.none");
    const title = displayName(item);
    const subtitle = title === item.name ? "" : `<span>${escapeHtml(item.name)}</span>`;
    return `<button class="card" type="button" data-exercise-id="${item.id}">` +
      `<strong>${escapeHtml(title)}</strong>${subtitle}` +
      `<span>${escapeHtml(label(state.t("card.target")))}${escapeHtml(item.target)} · ${escapeHtml(label(state.t("card.equipment")))}${escapeHtml(item.equipment)}</span>` +
      `<span>${escapeHtml(label(state.t("card.secondary")))}${escapeHtml(secondary)}</span></button>`;
  }

  /* 演示动图与它的署名同生共死：两者都来自 exercises.json 的同一个 media 块，
     没有署名就没有图——授权条件不允许把它们拆开渲染。 */
  function openExercise(id) {
    const item = state.exercises.find((exercise) => exercise.id === id);
    if (!item) return;
    const title = displayName(item);
    const zones = list(item.canonical_zones.map((zone) => state.labels.get(zone) || zone));
    const localized = state.locale === "zh-CN" ? item.instructions.zh : item.instructions.en;
    const original = state.locale === "zh-CN"
      ? `<h3>${escapeHtml(state.t("dialog.english"))}</h3><p lang="en">${escapeHtml(item.instructions.en)}</p>`
      : "";
    $("#exercise-detail").innerHTML =
      `<figure class="exercise-media">` +
        `<img src="./media/${encodeURIComponent(item.media.gif)}" width="180" height="180" ` +
          `alt="${escapeHtml(state.t("media.alt", { name: title }))}" loading="lazy">` +
        `<figcaption>${escapeHtml(item.media.attribution)}</figcaption>` +
      `</figure>` +
      `<h2>${escapeHtml(title)}</h2>${title === item.name ? "" : `<p class="subtitle">${escapeHtml(item.name)}</p>`}` +
      `<dl><dt>${escapeHtml(state.t("card.equipment"))}</dt><dd>${escapeHtml(item.equipment)}</dd>` +
      `<dt>${escapeHtml(state.t("card.target"))}</dt><dd>${escapeHtml(item.target)}</dd>` +
      `<dt>${escapeHtml(state.t("dialog.group"))}</dt><dd>${escapeHtml(item.muscle_group)}</dd>` +
      `<dt>${escapeHtml(state.t("card.secondary"))}</dt><dd>${escapeHtml(list(item.secondary_muscles) || state.t("card.none"))}</dd>` +
      `<dt>${escapeHtml(state.t("dialog.zones"))}</dt><dd>${escapeHtml(zones)}</dd></dl>` +
      `<h3>${escapeHtml(state.t("dialog.howto"))}</h3><p>${escapeHtml(localized)}</p>${original}`;
    $("#exercise-dialog").showModal();
  }

  function showError(error, stale) {
    const status = error && error.status;
    const key = status === 401 || status === 404 || status === 410 ? `error.${status}` : status >= 500 ? "error.5xx" : "";
    $("#status").className = "status error";
    $("#status").textContent =
      `${key ? state.t(key) : error.message || state.t("error.generic")}${stale && state.snapshot ? state.t("error.stale") : ""}`;
  }

  function unique(values) { return [...new Set(values)].sort((left, right) => left.localeCompare(right)); }
  function escapeHtml(value) { const node = document.createElement("span"); node.textContent = String(value); return node.innerHTML; }
})(globalThis);
