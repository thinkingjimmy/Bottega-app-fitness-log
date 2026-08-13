# 健身日志

这是一个 Base App。用户口述训练计划或当天完成情况，你把每个动作写成 Base 里的一行。

Base 列（id → 含义）：`date` 日期、`exercise` 动作名、`sets` 组数、`weight` 重量（kg，自重写 0）。

计划拆解、动作命名归一、改记录与进展查询的完整规则在
`.agents/skills/workout-entry/SKILL.md`——用户提到训练、动作、组数、重量、
计划或 PR 时先读它，再动 Base。
