---
name: workout-entry
displayName: 训练录入
description: 把训练计划或明确完成事实写入健身日志 Base，精确关联离线动作 id，并按 completed 记录回答进展、PR 与训练量问题。
requires: tools: bases:mutate
---

# 训练录入

Base 作用域已由当前 chat 的 lease 固定，不要猜 owner，也不要新建 Base。
基础操作（`base_describe` 先行、`expected_revision`、409 重读、分页游标）遵循
base-ops skill，本文只定义健身日志自己的约定。

## 列契约

| 列 id | 类型 | 写入规则 |
| --- | --- | --- |
| `date` | date | `YYYY-MM-DD`。「今天/昨天/周一」先换算成绝对日期。没说日期就用今天。 |
| `exercise` | text | 动作名，中文优先且**全库统一**：同一个动作在库里只能有一种写法。 |
| `exercise_id` | text | 只写 `gui/data/exercises.json` 中唯一匹配的上游 id；无法唯一确认时留空，禁止猜。 |
| `status` | select | 计划=`planned`；明确完成=`completed`；待用户确认的旧事实=`unknown`。新 row 必填。 |
| `sets` | number | 完成组数（整数）。计划里写「4×8」时组数取 4，次数信息放不下就不记。 |
| `weight` | number | 单侧/杠铃总重的 kg 数。自重动作（引体、俯卧撑、平板支撑）写 `0`。 |

## 动作 id 与命名归一

进度图按 `exercise` 分组，命名漂移就会把同一个动作拆成两条线。写入前先
`base_query`（`columns: ["exercise"]`）拿到库里已有的动作名：

- 用户说的是已有动作的别名（卧推 / 平板卧推 / bench press），一律沿用**库里已有的写法**。
- 同时读取 `gui/data/exercises.json`；只有名称/人工 alias 唯一匹配时才写其 `id`。
- 确实是目录外新动作才引入新名字，用最短的通用中文名，并让 `exercise_id` 留空。
- 用户明确要求改名时，`base_query` 找出全部旧名行后逐行 `base_patch_rows` 改齐，不留半旧半新。

## 录入协议

1. 先 `base_describe` 读到 `revision` 与列 schema。
2. 先判断语义：计划写 `planned`；用户说已练完/刚完成才写 `completed`。不能从过去式之外的模糊表达猜完成。
3. 行 id 用 `w-{YYYYMMDD}-{当日序号}`（如 `w-20260306-3`）。同日追加时先
   `base_query`（filter `date = 该日`）数出已有条数再编号，天然幂等。
4. 一次口述含多个动作（「今天练腿：深蹲 5×80，腿举 4×140」）就一次
   `base_insert_rows` 批量写入，一个动作一行。
5. 用户确认某个既有计划已完成时，先按 date/exercise 查询并 patch 对应 `planned` row 为
   `completed`；不得再插一份重复事实。只有找不到对应计划时才新增 completed row。
6. 写完回一行确认：日期、动作数、总组数、planned/completed 状态；只有 completed 才比较 PR。

## 改记录与查询

- 改已有记录用 `base_patch_rows`（字段级 LWW）；先 `base_query` 定位行 id，不凭记忆猜。
- 「今天深蹲加到 85」这类追加重量，是 patch 当天那一行，不是新插一行。
- 进展问题一律 `base_query`，只纳入 `status=completed` 且排除 `sample-*`；不要凭上下文回答。
- legacy row 缺 status 时按 `unknown` 处理。用户确认后可 patch；不得批量伪造成 completed。
- 完整导出用 `base_export_csv`，返回的是 artifact 元数据而不是内联 CSV 正文。

## 示例

输入「今天练胸：卧推 4 组 60，飞鸟 3 组 12」（今天是 2026-03-09）：

```
base_insert_rows rows=[
  { id: "w-20260309-1", values: { date: "2026-03-09", exercise: "杠铃卧推", exercise_id: "0025", status: "completed", sets: 4, weight: 60 } },
  { id: "w-20260309-2", values: { date: "2026-03-09", exercise: "单臂绳索下斜飞鸟", exercise_id: "1262", status: "completed", sets: 3, weight: 12 } }
]
```

回复：「已记 2026-03-09 两个动作、共 7 组；卧推 60kg 与历史最好成绩持平。」

## 不做的事

- 不删列、不改已有列类型——这些能力没有对 Agent 开放。
- 不给出医疗或伤病建议；用户提到疼痛时如实记录并建议咨询专业人士。
- 示例行（`sample-*`）永远不参与 PR、训练量或肌肉图，即使其 status 为 completed。
- 不把热力图当训练处方；它只是已完成组数的可视化，不承诺效果。
