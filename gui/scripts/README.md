# scripts/

> L2 | 父级: ../README.md

成员清单

- i18n.js: zh-CN/en/ja/fr/es 五语言界面文案、语言协商（精确→主语言→英文兜底）与 {n} 插值纯函数；训练计划禁用原因包含授权/数据修复动作。肌肉名归 data/muscle-regions.json，上游英文字段的译名归 data/terms.json——这里只管界面自己的话。
- base-api.js: 产品 `/_sdk/base-api.js` 的健身域兼容适配器；保留 Client/轮询形状，token、CAS、mutation 与 host action 由 SDK 唯一持有。
- plan-builder.js: local calendar、六列/`planned` option schema、live 名称权威、同日 planned 去重、完整 UUID stable row ids 与 frozen batch 纯函数。
- plan-submission.js: frozen batch/instance fence、bounded 429 retry、expectedRevision rebase、identical/absent/partial reconcile 与无 token session 恢复状态机。
- catalog.js: 动作关键词与 body/muscle/equipment 组合筛选、body part 分组纯函数；filterExercises 收可选 localize 投影把译名并入语料，groupByBodyPart 收可选 order 投影按显示文案排序——分组键本身仍是上游原文。
- muscle-stats.js: 六列诊断、本地日历/DST 范围、非法行/非正整数 sets 排除、固定权重和 `1-exp(-score/12)` 强度纯函数；只按字段判定，不按 row id 前缀特判，贡献项只留 id 不留展示名。
- main.js: 语言协商与文案填充、本地资源加载、按 body-map.json 组装男女正背面人体 SVG、动作目录与计划 dialog 编排；界面词汇全经 terms.json 投影，不与上游英文并置，动作说明按句拆成编号步骤；禁用原因常驻并关联入口，提交状态收敛到一条常驻状态位（语气分 busy/info/warn/error/done 五档，第二行永远是冻结批次摘要），unknown/hard-conflict/已提交待刷新状态始终复用 frozen ids，只有 all-absent 证据后的可编辑状态才允许显式丢弃。

依赖方向：`main → I18n | FitnessBaseApi(adapter) | Catalog | MuscleStats | PlanBuilder | PlanSubmission`，adapter → 产品 `BottegaBase` SDK；Fitness 六列语义止于 PlanBuilder。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
