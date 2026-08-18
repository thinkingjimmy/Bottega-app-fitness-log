# gui/

> L2 | 父级: ../README.md

成员清单

- index.html: 固定 GUI Surface 入口；动作目录、控件与两个空人体 SVG 取景框的可访问骨架，文案只写 `data-i18n` 键位不写字面量。
- styles.css: 响应式、深浅主题、reduced-motion、焦点与 OKLCH 单调热度视觉系统；轮廓/装饰件/热区三层配色与演示动图版式。
- scripts/: 语言协商、Base 读取、动作检索、统计与 DOM 编排纯模块，详见 scripts/README.md。
- data/: 固定上游提交生成的动作目录、男女解剖几何、五语言分区标签与供应链取证，详见 data/README.md。
- media/: 72 张 180×180 演示动图，详见 media/README.md。

依赖方向：`index.html → scripts/main.js → i18n.js + base-api.js + catalog.js + muscle-stats.js + data/*.json + media/*.gif`；任何模块都不得访问外网、preload、Node 或 Base 写端点。

三条硬约束：

- **人体 SVG 不内联在 HTML**：`main.js` 按 `data/body-map.json` 组装 outline/figure/zone 三层，只有 zone 组带 `data-muscle`、`tabindex` 与 role；装饰件（头发、手、足、膝、踝）永远不接收热度也不可聚焦。体型切换只是换一套几何，语义重建后分区数恒为 17。
- **文案不写死在页面里**：宿主把有效语言塞进 fragment（`#baseToken=…&lang=…`），`main.js` 协商后一次性填充；界面文案在 `scripts/i18n.js`，肌肉名在 `data/muscle-regions.json`。
- **署名与媒体同生共死**：演示动图和 `© Gym visual` 版权行来自 `exercises.json` 同一个 `media` 块，渲染在同一个 `figure` 里，拆不开。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
