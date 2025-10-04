import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode, command }) => {
  // 判断是否为开发模式：mode 为 development 或者 command 为 build 但 mode 不是 production
  const isDev = mode === 'development' || (command === 'build' && mode !== 'production')
  
  return {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/index.html')
        },
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          // 只在生产模式下移除 console.log，开发模式下保留
          drop_console: !isDev,
          drop_debugger: !isDev
        }
      },
      cssCodeSplit: false // 确保 CSS 不被分割
    },
    server: {
      port: 3000,
      open: true
    }
  }
})
