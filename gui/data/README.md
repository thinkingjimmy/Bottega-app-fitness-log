# data/

> L2 | 父级: ../README.md

成员清单

- exercises.json: 固定 72-id allowlist 的中英文说明、器械、肌肉字段、canonical zones 与去重权重；不含媒体 URL/字节。
- muscle-regions.json: 17 个 canonical zone 的 id 与中文标签，同时供人体图与筛选下拉使用。
- body-map.json: 正背面共 1448×1448 画布的 viewBox、人形轮廓、装饰件路径与按 zone 分组的解剖级肌肉路径。
- source.json: 动作目录上游仓库、40 位 commit、raw/generated SHA-256、生成器版本与 `mediaIncluded=false`。
- body-map.source.json: 人体图上游仓库、40 位 commit、assets/generated SHA-256、生成器版本与 `mediaIncluded/runtimeIncluded=false`。
- exercises-dataset.LICENSE.txt: hasaneyldrm/exercises-dataset 的完整 MIT 文本和媒体例外声明。
- body-highlighter.LICENSE.txt: HichamELBSI/react-native-body-highlighter 的完整 MIT 文本。

动作数据固定为 `hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd`，人体矢量图固定为
`HichamELBSI/react-native-body-highlighter@15df9e2dbc621450001960bed5a30e6a75357faa`。本 App 未复制任一上游的
`images/`、`videos/`、截图或 React Native 运行时——只搬 path 数据。

`body-map.json` 的 zone id 集合由生成器与 `exercises.json` 的 canonical_zones 并集、与 `muscle-regions.json`
的标签表三方互证；任一侧漂移都在生成期炸掉，图与统计口径不可能分叉。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
