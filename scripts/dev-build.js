import { createWriteStream, watch } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { copyFile, mkdir, readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// 防抖机制，避免重复执行
let buildTimeout = null
let isBuilding = false

function debouncedBuild() {
  if (isBuilding) {
    console.log('⏳ 构建正在进行中，跳过重复请求...')
    return
  }
  
  if (buildTimeout) {
    clearTimeout(buildTimeout)
  }
  
  buildTimeout = setTimeout(async () => {
    isBuilding = true
    try {
      await devBuild()
    } finally {
      isBuilding = false
    }
  }, 300) // 300ms 防抖延迟
}

async function devBuild() {
  try {
    console.log('开始开发模式构建...')
    
    // 确保 dist 目录存在
    const distDir = join(projectRoot, 'dist')
    if (!existsSync(distDir)) {
      await mkdir(distDir, { recursive: true })
    }
    
    // 将构建后的 index.html 移动到根目录并内联资源
    const builtHtmlPath = join(distDir, 'src', 'index.html')
    const rootHtmlPath = join(projectRoot, 'index.html')
    
    if (existsSync(builtHtmlPath)) {
      let htmlContent = await readFile(builtHtmlPath, 'utf-8')
      
      // 内联 JS 文件并包装在 DOMContentLoaded 事件中
      const jsPath = join(distDir, 'assets', 'main.js')
      if (existsSync(jsPath)) {
        const jsContent = (await readFile(jsPath, 'utf-8')).trim()
        // 包装在 DOMContentLoaded 事件中，确保 DOM 加载完成后再执行
        const wrappedJsContent = `document.addEventListener('DOMContentLoaded', function() {${jsContent}});`
        htmlContent = htmlContent.replace(
          /<script[^>]*src="[^"]*\.js"[^>]*><\/script>/g,
          `<script>${wrappedJsContent}</script>`
        )
        console.log('已内联 JS 文件并包装在 DOMContentLoaded 事件中')
      }
      
      // 内联 CSS 文件（从源文件读取）
      const scssPath = join(projectRoot, 'src', 'index.scss')
      if (existsSync(scssPath)) {
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execAsync = promisify(exec)
        
        try {
          // 使用 sass-embedded 编译 SCSS 并压缩
          const { stdout } = await execAsync(`npx sass-embedded "${scssPath}" --no-source-map --style=compressed`)
          const cssContent = stdout.trim()
          htmlContent = htmlContent.replace(
            /<style[^>]*src="[^"]*\.scss"[^>]*><\/style>/g,
            `<style>${cssContent}</style>`
          )
          console.log('已内联并压缩 CSS 文件')
        } catch (error) {
          console.warn('无法编译 SCSS 文件:', error.message)
        }
      }
      
      await writeFile(rootHtmlPath, htmlContent)
      console.log('✅ 开发模式构建完成，已生成 index.html')
    } else {
      throw new Error('构建后的 index.html 文件不存在')
    }
    
  } catch (error) {
    console.error('开发模式构建时出错:', error)
    process.exit(1)
  }
}

// 检查是否启用监听模式
const isWatchMode = process.argv.includes('--watch')

if (isWatchMode) {
  console.log('🔍 启动文件监听模式...')
  
  // 先执行一次 Vite 构建
  console.log('📦 执行初始 Vite 构建...')
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)
  
  try {
    await execAsync('vite build --mode development')
    console.log('✅ Vite 构建完成')
  } catch (error) {
    console.error('❌ Vite 构建失败:', error.message)
    process.exit(1)
  }
  
  // 执行初始构建
  await devBuild()
  
  // 启动 Vite 监听模式
  console.log('🚀 启动 Vite 监听模式...')
  const viteProcess = exec('vite build --mode development --watch')
  
  // 只监听 dist 目录下的文件变化
  const distDir = join(projectRoot, 'dist')
  const assetsDir = join(distDir, 'assets')
  
  // 监听 assets 目录
  if (existsSync(assetsDir)) {
    watch(assetsDir, { recursive: true }, (eventType, filename) => {
      if (filename && (filename.endsWith('.js') || filename.endsWith('.css'))) {
        console.log(`📁 检测到文件变化: ${filename}`)
        debouncedBuild()
      }
    })
    console.log('✅ 正在监听 dist/assets 目录...')
  }
  
  // 保持进程运行
  process.on('SIGINT', () => {
    console.log('\n👋 停止文件监听...')
    if (buildTimeout) {
      clearTimeout(buildTimeout)
    }
    if (viteProcess && viteProcess.kill) {
      viteProcess.kill()
    }
    process.exit(0)
  })
} else {
  // 非监听模式，只执行一次构建
  devBuild()
}
