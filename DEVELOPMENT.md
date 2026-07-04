# 开发说明

使用 Vite + TypeScript 构建。

## 构建特性

1. **SCSS 编译**：使用 `sass-embedded` 编译 SCSS 并压缩
2. **资源内联**：自动将 CSS 和 JS 内联到 HTML
3. **代码压缩**：使用 Terser 压缩 JavaScript（仅生产模式）
4. **包生成**：自动生成 `package.zip`（仅生产模式）

## 命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 开发模式连续构建，不启动服务器；CSS 压缩，JS 不压缩 |
| `pnpm build` | 生产构建；CSS/JS 均压缩，并生成 `package.zip` |

## 输出

- **开发 / 生产**：`index.html`（内联 CSS、JS）
- **仅生产**：`package.zip`，包含 `icon.png`、`preview.png`、`README.md`、`README.zh-CN.md`、`widget.json`、`index.html`
