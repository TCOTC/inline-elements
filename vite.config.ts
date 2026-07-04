import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { copyWidgetHtmlPlugin } from './scripts/vite-plugin-copy-widget-html'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode, command }) => {
  // 判断是否为开发模式：mode 为 development 或者 command 为 build 但 mode 不是 production
  const isDev = mode === 'development' || (command === 'build' && mode !== 'production')

  return {
    plugins: [
      viteSingleFile(),
      copyWidgetHtmlPlugin(projectRoot)
    ],
    build: {
      outDir: 'dist',
      minify: !isDev,
      modulePreload: false,
      rolldownOptions: {
        input: {
          main: resolve(projectRoot, 'src/index.html')
        },
        output: {
          ...(!isDev ? {
            minify: {
              compress: {
                // 只在生产模式下移除 console.log，开发模式下保留
                dropConsole: true
              }
            }
          } : {})
        }
      }
    },
    server: {
      port: 3000,
      open: true
    }
  }
})
