/**
 * [INPUT]: 依赖 FitnessBaseApi/FitnessCatalog/FitnessMuscleStats 全局纯模块、index DOM 与本地 data JSON（含 body-map.json 几何与 muscle-regions.json 标签）
 * [OUTPUT]: 编排原子 Base 快照、训练诊断、解剖级人体 SVG 组装与热度/下钻、含次要肌肉可访问文本的动作组合筛选/24 项分批渲染与结构化错误状态
 * [POS]: gui/scripts 的浏览器组合根；只读、零外网，5xx 保留上次成功快照并显式标旧
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */

/* global Option, document, fetch */

(function startFitnessGui(global) {
  "use strict";
  const SVG_NS = "http://www.w3.org/2000/svg";
  const $ = (selector) => document.querySelector(selector);
  const state = { exercises: [], regions: [], labels: new Map(), snapshot: null, analysis: null, selectedMuscle: "", visible: 24 };
  const EXCLUSIONS = {
    sample: "示例行", planned: "计划尚未完成", "status-unknown": "状态未知或非法",
    "exercise-unknown": "动作 id 缺失或未知", "sets-invalid": "组数非法",
    "date-invalid": "日期非法", "outside-range": "不在所选时间范围",
  };

  document.addEventListener("DOMContentLoaded", () => void boot());

  async function boot() {
    bindControls();
    try {
      const token = global.FitnessBaseApi.consumeToken(global.location, global.history);
      if (!token) throw new global.FitnessBaseApi.BaseApiError(401, "缺少 Base token，请刷新应用");
      const [exercises, regions, bodyMap] = await Promise.all([
        loadJson("./data/exercises.json"), loadJson("./data/muscle-regions.json"), loadJson("./data/body-map.json"),
      ]);
      state.exercises = exercises;
      state.regions = regions;
      state.labels = new Map(regions.map((region) => [region.id, region.label]));
      renderBodyMaps(bodyMap);
      populateFilters();
      renderCatalog();
      const client = new global.FitnessBaseApi.Client({ token });
      publish(await client.refresh());
      client.startPolling(publish, (error) => showError(error, true));
      global.addEventListener("beforeunload", () => client.stopPolling(), { once: true });
    } catch (error) {
      showError(error, false);
    }
  }

  async function loadJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`本地资源加载失败：${path}`);
    return response.json();
  }

  function publish(snapshot) {
    state.snapshot = snapshot;
    $("#revision").textContent = String(snapshot.meta.revision);
    const schemaIssues = global.FitnessMuscleStats.validateColumns(snapshot.meta.columns);
    if (schemaIssues.length) {
      $("#status").className = "status error";
      $("#status").textContent = `Base 列合同不完整：${schemaIssues.map((issue) => `${issue.id}(${issue.reason})`).join("、")}。请前往“数据”修复。`;
    } else {
      $("#status").className = "status";
      $("#status").textContent = `已原子读取 ${snapshot.rows.length} 行；页面每 5 秒检查 revision。`;
    }
    calculate();
  }

  function calculate() {
    if (!state.snapshot || !state.exercises.length) return;
    state.analysis = global.FitnessMuscleStats.analyzeRows(
      state.snapshot.rows, state.exercises, $("#range").value, new Date()
    );
    renderHeat();
    renderDiagnostics();
    if (state.selectedMuscle) renderMuscleDetail(state.selectedMuscle);
  }

  /* ---------------------------------------------------------------- body map
     几何来自生成器固化的 body-map.json：outline 是人形轮廓，figure 是头发/手足
     等纯装饰件（永不接收热度），zone 是 17 个 canonical 区域的可聚焦分组。 */
  function renderBodyMaps(map) {
    document.querySelectorAll("[data-view]").forEach((svg) => {
      const view = map.views[svg.dataset.view];
      svg.setAttribute("viewBox", map.viewBox[svg.dataset.view]);
      svg.append(shape("path", { class: "outline", d: view.outline }));
      svg.append(group("figure", view.figure.map((d) => shape("path", { d }))));
      view.zones.forEach((zone) => svg.append(zoneGroup(zone)));
    });
  }

  function zoneGroup(zone) {
    const node = group("zone", zone.paths.map((d) => shape("path", { d })));
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

  function group(className, children) {
    const node = shape("g", { class: className });
    children.forEach((child) => node.append(child));
    return node;
  }

  function shape(tag, attributes) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
    return node;
  }

  function renderHeat() {
    document.querySelectorAll("[data-muscle]").forEach((element) => {
      const muscle = element.dataset.muscle;
      const score = state.analysis.scores[muscle] || 0;
      const intensity = global.FitnessMuscleStats.intensity(score);
      const level = intensity === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil(intensity * 4)));
      element.dataset.level = String(level);
      element.setAttribute("aria-label", `${state.labels.get(muscle) || muscle}，得分 ${score.toFixed(1)}`);
      element.classList.toggle("selected", muscle === state.selectedMuscle);
    });
  }

  function renderMuscleDetail(muscle) {
    state.selectedMuscle = muscle;
    if (!state.analysis) return;
    renderHeat();
    const score = state.analysis.scores[muscle] || 0;
    const items = state.analysis.contributions[muscle] || [];
    const totalSets = items.reduce((sum, item) => sum + item.sets, 0);
    const uniqueRows = new Set(items.map((item) => item.rowId)).size;
    $("#muscle-detail").innerHTML = `<h3>${escapeHtml(state.labels.get(muscle) || muscle)}</h3><p>得分 <strong>${score.toFixed(1)}</strong> · 完成组数 ${totalSets} · 训练记录 ${uniqueRows}</p>${items.length ? `<ol>${items.slice(0, 8).map((item) => `<li>${escapeHtml(item.exercise)}：${item.sets} 组，贡献 ${item.points.toFixed(1)}</li>`).join("")}</ol>` : "<p>所选范围内暂无合规 completed 记录。</p>"}`;
  }

  function renderDiagnostics() {
    const entries = Object.entries(state.analysis.diagnostics);
    $("#diagnostic-summary").textContent = `未纳入统计：${state.analysis.excludedRows} 条`;
    $("#diagnostics").innerHTML = entries.length
      ? entries.map(([reason, count]) => `<li>${escapeHtml(EXCLUSIONS[reason] || reason)}：${count}</li>`).join("")
      : "<li>所有记录均符合当前统计口径。</li>";
  }

  function bindControls() {
    $("#range").addEventListener("change", calculate);
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
  }

  function populateFilters() {
    addOptions("#body-filter", unique(state.exercises.map((item) => item.body_part)).map(self));
    addOptions("#muscle-filter", state.regions.map((region) => [region.label, region.id]));
    addOptions("#equipment-filter", unique(state.exercises.map((item) => item.equipment)).map(self));
  }

  function addOptions(selector, entries) {
    const select = $(selector);
    entries.forEach(([label, value]) => select.add(new Option(label, value)));
  }
  function self(value) { return [value, value]; }

  function renderCatalog() {
    if (!state.exercises.length) return;
    const filtered = global.FitnessCatalog.filterExercises(state.exercises, {
      query: $("#query").value, bodyPart: $("#body-filter").value,
      muscle: $("#muscle-filter").value, equipment: $("#equipment-filter").value,
    });
    const visible = filtered.slice(0, state.visible);
    $("#result-count").textContent = `${filtered.length} 个动作`; 
    $("#more").hidden = visible.length >= filtered.length;
    $("#catalog").innerHTML = visible.length ? global.FitnessCatalog.groupByBodyPart(visible).map(([group, items]) =>
      `<section class="catalog-group"><h3>${escapeHtml(group)}</h3><div class="cards">${items.map(cardHtml).join("")}</div></section>`
    ).join("") : '<p class="empty">没有匹配动作。清除筛选后再试。</p>';
    document.querySelectorAll(".card").forEach((button) => button.addEventListener("click", () => openExercise(button.dataset.exerciseId)));
  }

  function cardHtml(item) {
    const secondary = item.secondary_muscles.length
      ? item.secondary_muscles.join("、")
      : "无";
    return `<button class="card" type="button" data-exercise-id="${item.id}"><strong>${escapeHtml(item.aliases[0] || item.name)}</strong><span>${escapeHtml(item.name)}</span><span>主要肌肉：${escapeHtml(item.target)} · 器械：${escapeHtml(item.equipment)}</span><span>次要肌肉：${escapeHtml(secondary)}</span></button>`;
  }

  function openExercise(id) {
    const item = state.exercises.find((exercise) => exercise.id === id);
    if (!item) return;
    $("#exercise-detail").innerHTML = `<p class="eyebrow">${item.id} · EXERCISES-DATASET</p><h2>${escapeHtml(item.aliases[0])}</h2><p>${escapeHtml(item.name)}</p><dl><dt>器械</dt><dd>${escapeHtml(item.equipment)}</dd><dt>主要肌肉</dt><dd>${escapeHtml(item.target)}</dd><dt>协同肌肉</dt><dd>${escapeHtml(item.muscle_group)}</dd><dt>次要肌肉</dt><dd>${escapeHtml(item.secondary_muscles.join("、"))}</dd><dt>区域</dt><dd>${escapeHtml(item.canonical_zones.join("、"))}</dd></dl><h3>中文说明</h3><p>${escapeHtml(item.instructions.zh)}</p><h3>English</h3><p lang="en">${escapeHtml(item.instructions.en)}</p><p class="subtitle">元数据与说明：hasaneyldrm/exercises-dataset@7455efae…（MIT）；未使用上游媒体。</p>`;
    $("#exercise-dialog").showModal();
  }

  function showError(error, stale) {
    const status = error && error.status;
    const messages = { 401: "Base token 已过期，请刷新应用。", 404: "该 App 尚无 Base 数据。", 410: "App generation 已切换，请刷新应用。" };
    $("#status").className = "status error";
    $("#status").textContent = `${messages[status] || (status >= 500 ? "Base 服务暂时不可用。" : error.message || "读取失败。")}${stale && state.snapshot ? " 正在保留上次成功快照。" : ""}`;
  }

  function unique(values) { return [...new Set(values)].sort((left, right) => left.localeCompare(right)); }
  function escapeHtml(value) { const node = document.createElement("span"); node.textContent = String(value); return node.innerHTML; }
})(globalThis);
