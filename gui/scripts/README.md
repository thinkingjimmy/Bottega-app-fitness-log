# scripts/

> L2 | 父级: ../README.md

成员清单

- i18n.js: zh-CN/en/ja/fr/es 五语言界面文案、语言协商（精确→主语言→英文兜底）与 {n} 插值纯函数；肌肉名不在这里，那是 data/muscle-regions.json 的多语言标签。
- base-api.js: fragment（token + 宿主语言）一次性消费、Bearer、instance+revision 双闸一致分页、structured mutation error、batch POST，以及 stop/fatal 收敛与 visibility 轮询。
- plan-builder.js: local calendar、六列/`planned` option schema、live 名称权威、同日 planned 去重、完整 UUID stable row ids 与 frozen batch 纯函数。
- plan-submission.js: frozen batch/instance fence、bounded 429 retry、expectedRevision rebase、identical/absent/partial reconcile 与无 token session 恢复状态机。
- catalog.js: 动作关键词与 body/muscle/equipment 组合筛选、body part 分组纯函数。
- muscle-stats.js: 六列诊断、本地日历/DST 范围、非法行/非正整数 sets 排除、固定权重和 `1-exp(-score/12)` 强度纯函数；只按字段判定，不按 row id 前缀特判，贡献项只留 id 不留展示名。
- main.js: 语言协商与文案填充、本地资源加载、按 body-map.json 组装男女正背面人体 SVG、含次要肌肉文本的可访问动作卡、演示动图与 Gym visual 署名同框渲染、有限批次 DOM、状态/错误、SVG 热度与键盘下钻编排。

依赖方向：`main → I18n | BaseApi | Catalog | MuscleStats | PlanBuilder | PlanSubmission`；叶模块彼此独立并可在 Node VM 中纯测。Fitness 六列语义止于 PlanBuilder，Base API 只传通用 rows。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
