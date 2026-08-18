# gui/

> L2 | 父级: ../README.md

成员清单

- index.html: 固定 GUI Surface 入口；动作目录、诊断与两个空人体 SVG 取景框的可访问语义骨架。
- styles.css: 响应式、深浅主题、reduced-motion、焦点与 OKLCH 单调热度视觉系统；轮廓/装饰件/热区三层配色。
- scripts/: Base 读取、动作检索、统计与 DOM 编排纯模块，详见 scripts/README.md。
- data/: 固定上游提交生成的 72 项零媒体动作目录、解剖级人体几何与供应链取证，详见 data/README.md。

依赖方向：`index.html → scripts/main.js → base-api.js + catalog.js + muscle-stats.js + data/*.json`；任何模块都不得访问外网、preload、Node 或 Base 写端点。

人体 SVG 不再内联在 HTML 里：`main.js` 按 `data/body-map.json` 组装 outline/figure/zone 三层，只有 zone 组带
`data-muscle`、`tabindex` 与 role，装饰件（头发、手、足、膝、踝）永远不接收热度也不可聚焦。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
