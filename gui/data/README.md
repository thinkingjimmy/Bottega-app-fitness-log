# data/

> L2 | 父级: ../README.md

成员清单

- exercises.json: 固定 72-id allowlist 的中英文说明、器械、肌肉字段、canonical zones、去重权重，以及每条动作的 `media`（动图文件名 + Gym visual 署名）。
- muscle-regions.json: 17 个 canonical zone 的 id 与五语言标签（zh-CN/en/ja/fr/es）。
- body-map.json: 男女各一套正背面几何——统一取景框、人形轮廓、装饰件路径与按 zone 分组的解剖级肌肉路径。
- source.json: 动作目录上游仓库、40 位 commit、raw/generated SHA-256、生成器版本与媒体取证（数量、字节、聚合 SHA-256、授权分辨率与署名原文）。
- body-map.source.json: 人体图上游仓库、40 位 commit、assets/generated SHA-256、生成器版本、体型与语言清单。
- exercises-dataset.LICENSE.txt: hasaneyldrm/exercises-dataset 的完整 MIT 文本与媒体例外声明。
- gym-visual.NOTICE.md: Gym visual 媒体的授权条款原文（180×180 上限与必带署名）。
- body-highlighter.LICENSE.txt: HichamELBSI/react-native-body-highlighter 的完整 MIT 文本。

上游钉版：动作数据 `hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd`，
人体矢量图 `HichamELBSI/react-native-body-highlighter@15df9e2dbc621450001960bed5a30e6a75357faa`。
未复制任一上游的截图或 React Native 运行时——几何只搬 path 数据。

两条生成期不变量：

- **zone 三方互证**：`body-map.json` 画出的分区、`muscle-regions.json` 的标签表、`exercises.json` 的 canonical_zones 并集必须完全相等，任一侧漂移都在生成期炸掉，图与统计口径不可能分叉。
- **媒体授权即代码**：Gym visual 的授权只到 180×180 且每次使用必须带署名，两条都逐文件校验（GIF 头部读逻辑屏尺寸、记录级比对署名原文）；不满足就整批不发布。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
