import { createWriteStream } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import archiver from 'archiver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

async function buildPackage() {
  try {
    console.log('开始构建 package.zip...')

    const rootHtmlPath = join(projectRoot, 'index.html')
    if (!existsSync(rootHtmlPath)) {
      throw new Error('index.html 不存在，请先执行 vite build')
    }

    const packageZipPath = join(projectRoot, 'package.zip')
    const output = createWriteStream(packageZipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', function() {
      console.log(`✅ package.zip 构建完成: ${packageZipPath}`)
      console.log(`压缩包大小: ${archive.pointer()} bytes`)
    })

    archive.on('error', function(err) {
      throw err
    })

    archive.pipe(output)

    const filesToInclude = [
      'icon.png',
      'preview.png',
      'README.md',
      'README.zh-CN.md',
      'widget.json',
      'index.html'
    ]

    for (const file of filesToInclude) {
      const filePath = join(projectRoot, file)
      if (existsSync(filePath)) {
        archive.file(filePath, { name: file })
        console.log(`已添加 ${file}`)
      } else {
        console.warn(`警告: 文件 ${file} 不存在，将跳过`)
      }
    }

    await archive.finalize()

  } catch (error) {
    console.error('构建 package.zip 时出错:', error)
    process.exit(1)
  }
}

buildPackage()
