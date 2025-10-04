import { createWriteStream } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { copyFile, mkdir, readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import archiver from 'archiver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

async function buildPackage() {
  try {
    console.log('开始构建 package.zip...')
    
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
      console.log('已将 index.html 移动到根目录并内联资源')
    } else {
      throw new Error('构建后的 index.html 文件不存在')
    }
    
    // 创建 package.zip 文件
    const packageZipPath = join(projectRoot, 'package.zip')
    const output = createWriteStream(packageZipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    
    // 监听所有 archive 数据都写入完成
    output.on('close', function() {
      console.log(`✅ package.zip 构建完成: ${packageZipPath}`)
      console.log(`压缩包大小: ${archive.pointer()} bytes`)
    })
    
    // 监听错误
    archive.on('error', function(err) {
      throw err
    })
    
    // 将 archive 数据流连接到输出流
    archive.pipe(output)
    
    // 需要包含的文件列表
    const filesToInclude = [
      'icon.png',
      'preview.png', 
      'README.md',
      'README_zh_CN.md',
      'widget.json',
      'index.html'
    ]
    
    // 添加文件到压缩包
    for (const file of filesToInclude) {
      const filePath = join(projectRoot, file)
      if (existsSync(filePath)) {
        archive.file(filePath, { name: file })
        console.log(`已添加 ${file}`)
      } else {
        console.warn(`警告: 文件 ${file} 不存在，将跳过`)
      }
    }
    
    // 完成压缩
    await archive.finalize()
    
  } catch (error) {
    console.error('构建 package.zip 时出错:', error)
    process.exit(1)
  }
}

buildPackage()
