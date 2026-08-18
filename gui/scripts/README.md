# scripts/

> L2 | 父级: ../README.md

成员清单

- i18n.js: zh-CN/en/ja/fr/es 五语言界面文案、语言协商（精确→主语言→英文兜底）与 {n} 插值纯函数；肌肉名不在这里，那是 data/muscle-regions.json 的多语言标签。
- base-api.js: fragment（token + 宿主语言）一次性消费、Bearer、nextCursor 完整分页、revision 双检、409 退避，以及 stop/fatal 收敛与健康恢复的 visibility 轮询。
- catalog.js: 动作关键词与 body/muscle/equipment 组合筛选、body part 分组纯函数。
- muscle-stats.js: 六列诊断、本地日历/DST 范围、非法行/非正整数 sets 排除、固定权重和 `1-exp(-score/12)` 强度纯函数；只按字段判定，不按 row id 前缀特判，贡献项只留 id 不留展示名。
- main.js: 语言协商与文案填充、本地资源加载、按 body-map.json 组装男女正背面人体 SVG、含次要肌肉文本的可访问动作卡、演示动图与 Gym visual 署名同框渲染、有限批次 DOM、状态/错误、SVG 热度与键盘下钻编排。

依赖方向：`main → I18n | BaseApi | Catalog | MuscleStats`；四个叶模块彼此独立并可在 Node VM 中纯测。展示字符串只在 main 里成形——统计模块拿不到语言，也就不该持有人类可读文本。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
