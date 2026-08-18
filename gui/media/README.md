# media/

> L2 | 父级: ../README.md

成员清单

- `<exercise_id>.gif`: 72 张 180×180 动作演示动图，文件名即 `exercises.json` 的动作 id，由 `generate-fitness-catalog.ts` 从上游 `videos/` 按 allowlist 拷入。

这些字节**不在上游 MIT 覆盖范围内**。它们是 Gym visual 的财产，按独立授权随包分发，条款见 `../data/gym-visual.NOTICE.md`：

> © Gym visual — https://gymvisual.com/

- **分辨率上限 180×180**：生成器读 GIF 头部逐个校验，越权文件不许落盘。
- **每次使用必须带署名**：署名与文件名同在 `exercises.json` 的 `media` 块里，GUI 把两者渲染进同一个 `figure`，没有署名就没有图。

目录里不放任何非授权媒体：上游的 `images/` 缩略图与截图都没有复制。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
