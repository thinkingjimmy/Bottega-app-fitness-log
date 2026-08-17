# 健身日志

这是一个 Base App。用户口述训练计划或当天完成情况，你把每个动作写成 Base 里的一行。

Base 列（id → 含义）：`date` 日期、`exercise` 动作名、`exercise_id` 固定目录 id、
`status`（planned/completed/unknown）、`sets` 组数、`weight` 重量（kg，自重写 0）。

有明确完成事实才写 `completed`；计划写 `planned`；无法确认的旧记录保持 `unknown`。
动作 id 只能使用 `gui/data/exercises.json` 的精确 id，无法唯一匹配就留空，禁止猜测。

计划拆解、动作命名归一、改记录与进展查询的完整规则在
`.agents/skills/workout-entry/SKILL.md`——用户提到训练、动作、组数、重量、
计划、完成确认或 PR 时先读它，再动 Base。GUI 只读，不提供写入按钮。
