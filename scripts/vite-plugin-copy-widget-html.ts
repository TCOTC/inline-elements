import { existsSync } from 'fs'
import { copyFile } from 'fs/promises'
import { join } from 'path'
import type { Plugin } from 'vite'

/** 将 dist 内联后的 index.html 复制到项目根目录 */
export function copyWidgetHtmlPlugin(projectRoot: string): Plugin {
  const builtHtmlPath = join(projectRoot, 'dist', 'src', 'index.html')
  const rootHtmlPath = join(projectRoot, 'index.html')

  return {
    name: 'copy-widget-html',
    apply: 'build',
    async closeBundle() {
      if (!existsSync(builtHtmlPath)) {
        this.error('构建后的 index.html 文件不存在')
      }
      await copyFile(builtHtmlPath, rootHtmlPath)
      console.log('✅ 已生成内联 index.html')
    }
  }
}
