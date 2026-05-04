import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const MIME: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif',
}

function staticFolderPlugin(route: string, dir: string) {
  return {
    name: `serve-${route}`,

    configureServer(server: any) {
      server.middlewares.use(`/${route}`, (req: any, res: any, next: any) => {
        const file = path.join(dir, decodeURIComponent(req.url ?? ''))
        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
          res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
          res.setHeader('Cache-Control', 'public, max-age=3600')
          fs.createReadStream(file).pipe(res)
        } else {
          next()
        }
      })
    },

    closeBundle() {
      if (!fs.existsSync(dir)) return
      const dest = path.resolve(__dirname, `dist/${route}`)
      fs.mkdirSync(dest, { recursive: true })
      for (const file of fs.readdirSync(dir)) {
        fs.copyFileSync(path.join(dir, file), path.join(dest, file))
      }
      console.log(`[${route}] Copied to dist/${route}`)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    staticFolderPlugin('map_pic',  path.resolve(__dirname, 'map_pic')),
    staticFolderPlugin('hero_pic', path.resolve(__dirname, 'hero_pic')),
  ],
})
