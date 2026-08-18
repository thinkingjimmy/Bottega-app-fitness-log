# 🏋️ 健身日志

健身日志明确区分计划与已完成训练。在 Use chat 中录入；打开只读“应用”界面，可搜索 72 项离线动作目录并查看正背面肌肉热力图。“数据”始终是事实源。

## 数据合同

新 row 使用 `date`、`exercise`、`exercise_id`、`status`、`sets`、`weight` 六列。`status` 为 `planned | completed | unknown`；进展图和热力图只统计有合法目录 id 的 completed rows。安装种子的 `sample-*` 使用 `status=unknown`，热力图还会按保留 id 前缀做第二重排除，绝不冒充用户训练。

现有实例由通用 `migrations/base.json` 升级：只追加缺失的 v2 列，legacy row 写入 `status=unknown`，仅在动作名或别名精确且唯一时补 `exercise_id`。已有值绝不覆盖；同 id 列类型冲突时在任何写入前停止，并提示先导出恢复。

热力图只按组数计分，不按重量：目标区 ×1.0、协同肌群 ×0.65、每个次要区 ×0.35；同一区域在单个动作中重复时只取最高权重。展示强度固定为 `1 - exp(-score / 12)`，只是可视化尺度，不是训练或医疗建议。未纳入行会按原因显示诊断。

## 离线动作与解剖数据

目录由 [`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset) 的固定提交 `7455efae41b330c265e7cd4b78dfa848e7ce5ebd` 生成。动作元数据和说明按其 MIT 许可分发，完整文本位于 `gui/data/exercises-dataset.LICENSE.txt`。

正背面肌肉图由 [`HichamELBSI/react-native-body-highlighter`](https://github.com/HichamELBSI/react-native-body-highlighter) 的固定提交 `15df9e2dbc621450001960bed5a30e6a75357faa` 生成，按其 MIT 许可分发，完整文本位于 `gui/data/body-highlighter.LICENSE.txt`。只搬 SVG path 数据，不含 React Native 运行时、截图或其它上游资源。

本 App 不含上游图片、GIF 或其它 Gym visual 媒体。GUI 运行时零外网，只通过带 token 的只读 `/_api/base` 网关读取 Base。

## 使用

1. 在 Use chat 描述计划或明确已完成的训练。
2. 确认计划已完成时 patch 原 row，不重复插入。
3. 在“应用”查看目录和热力图，在“数据”检查或修正 row。
4. 未知动作让 `exercise_id` 留空；Agent 禁止猜 id。

## 依赖

无。App 只使用 AI Chat 内置 Base 工具与只读 GUI 网关。

## 包结构

- `app.json`：Base App manifest。
- `data/base.json`：v2 六列安装种子与 completed-only 进展视图。
- `migrations/base.json`：通用、幂等的 live Base 升级描述符。
- `gui/`：固定离线 GUI Surface 入口、脚本、固定动作目录与解剖级人体几何数据。
- `.agents/skills/workout-entry/SKILL.md`：planned/completed 录入协议。

## 许可

App 代码：MIT。两个上游项目均为 MIT，完整许可证文本、固定 commit 与媒体例外保留在 `gui/data/*.LICENSE.txt` 与 `gui/data/*source*.json`。
