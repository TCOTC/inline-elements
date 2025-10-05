# 构建说明

## 项目配置

本项目使用 Vite + TypeScript 构建，支持以下功能：

- **开发模式**: `pnpm dev` - 连续构建开发版本文件（不启动服务器）
- **构建模式**: `pnpm build` - 构建生产版本并生成 package.zip

## 构建特性

1. **SCSS 编译**: 使用 `sass-embedded` 编译 SCSS 文件并压缩
2. **资源内联**: 自动将 CSS 和 JS 内联到 HTML 文件中
3. **代码压缩**: 使用 Terser 压缩 JavaScript 代码（仅生产模式）
4. **包生成**: 自动生成包含所有必要文件的 package.zip（仅生产模式）

## 命令说明

- **`pnpm dev`**: 开发模式连续构建，只生成文件，不启动服务器（基于 `scripts/dev-build.js`）
  - 输出 `index.html`（已内联资源）
  - CSS 压缩，JavaScript 不压缩，便于调试

- **`pnpm build`**: 生产模式构建（`vite build && node scripts/build-package.js`）
  - 生成 `index.html` - 内联了所有资源且已压缩
  - CSS 和 JavaScript 均压缩
  - 生成 `package.zip` - 包含：
    - `icon.png`
    - `preview.png`
    - `README.md`
    - `README_zh_CN.md`
    - `widget.json`
    - `index.html`

## 技术栈

- **Vite**: ^7.1.9
- **TypeScript**: ^5.9.3
- **@types/node**: ^24.6.2
- **sass-embedded**: ^1.69.5
- **terser**: ^5.24.0
- **archiver**: ^7.0.1
- **siyuan**: ^1.1.5

注：Node.js 版本请使用与本地环境兼容的稳定版本；依赖的准确版本以 `package.json` 为准。
