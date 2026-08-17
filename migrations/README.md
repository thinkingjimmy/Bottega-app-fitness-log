# migrations/

> L2 | 父级: ../README.md

成员清单

- `base.json`: 通用 App Base data migration v1；追加 `exercise_id/status`，旧 row 补 `unknown`，仅精确唯一别名补动作 id。

依赖边界：只声明数据变换，不直接访问 Base；平台在 owner 队列内原子执行，类型冲突零写入。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
