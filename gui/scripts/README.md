# scripts/

> L2 | 父级: ../README.md

成员清单

- base-api.js: fragment token 一次性消费、Bearer、nextCursor 完整分页、revision 双检、409 退避与 visibility 轮询。
- catalog.js: 动作关键词与 body/muscle/equipment 组合筛选、body part 分组纯函数。
- muscle-stats.js: 六列诊断、sample/非法行排除、固定权重和 `1-exp(-score/12)` 强度纯函数。
- main.js: 本地资源加载、有限批次 DOM、状态/错误、SVG 热度与键盘下钻编排。

依赖方向：`main → BaseApi | Catalog | MuscleStats`；三个叶模块彼此独立并可在 Node VM 中纯测。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
