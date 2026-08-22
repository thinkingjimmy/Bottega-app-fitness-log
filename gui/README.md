# gui/

> L2 | 父级: ../README.md

成员清单

- index.html: 固定 GUI Surface 入口；索引式动作目录、人体 SVG 图版、动作详情、常驻计划禁用原因与列头式训练计划 dialog 的可访问骨架。
- styles.css: 响应式、深浅主题、reduced-motion、焦点与 OKLCH 单调热度视觉系统；纸面报头/图版/点导线/索引行的「训练手册」版式，轮廓/装饰件/热区三层配色与演示动图版式。字体全部系统栈。
- plan.css: 训练计划入口常驻原因、列头式行表与四档常驻状态位，以及 dialog 的 44px 触控、busy、窄窗与可访问反馈增量样式；通用视觉仍归 styles.css。
- scripts/: 语言协商、Base 读写、动作检索、统计、plan builder/submission 与 DOM 编排，详见 scripts/README.md。
- data/: 固定上游提交生成的动作目录、男女解剖几何、五语言分区标签、上游英文字段的五语言译名与供应链取证，详见 data/README.md。
- media/: 72 张 180×180 演示动图，详见 media/README.md。

依赖方向：`index.html → scripts/main.js → i18n + base-api + catalog + muscle-stats + plan-builder + plan-submission + local data/media`；任何模块都不得访问外网、preload 或 Node，Base mutation 只经同源 append-only API。

五条硬约束：

- **人体 SVG 不内联在 HTML**：`main.js` 按 `data/body-map.json` 组装 outline/figure/zone 三层，只有 zone 组带 `data-muscle`、`tabindex` 与 role；装饰件（头发、手、足、膝、踝）永远不接收热度也不可聚焦。体型切换只是换一套几何，语义重建后分区数恒为 17。
- **文案不写死在页面里**：宿主把有效语言塞进 fragment（`#baseToken=…&lang=…`），`main.js` 协商后一次性填充；界面文案在 `scripts/i18n.js`，肌肉名在 `data/muscle-regions.json`。
- **禁用原因不能藏进 tooltip**：入口不可用时，权限/schema 原因常驻显示并由 `aria-describedby` 关联按钮；原因同时告诉用户去授权或前往“数据”修复。
- **署名与媒体同生共死**：演示动图和 `© Gym visual` 版权行来自 `exercises.json` 同一个 `media` 块，渲染在同一个 `figure` 里，拆不开。
- **界面里不并置中英**：上游只给英文字段，界面一律经 `data/terms.json` 投影成当前语言；动作名在中文界面用人工别名、其余语言用上游原名，两者从不同时出现。唯一例外是页脚三条署名——那是许可要求的原文，删不得也译不得。
- **一个字节都不外借**：字体全部系统栈（拉丁与数字逐字符落系统衬线，中文落宋体，正文落苹方），没有 `@font-face`、没有外链。`fitness-gui.test.ts` 用 `doesNotMatch(/https?:\/\//)` 守着整个入口面。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
