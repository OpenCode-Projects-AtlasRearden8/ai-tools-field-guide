#!/usr/bin/env node
'use strict'

const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname)
const SITE_DIR = path.join(ROOT, 'site')
const PORT = Number(process.env.PORT || 8080)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

if (!fs.existsSync(path.join(SITE_DIR, 'index.html'))) {
  console.error('No site/ output yet. Run "npm run build" first.')
  process.exit(1)
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  let filePath = path.normalize(path.join(SITE_DIR, urlPath))
  if (!filePath.startsWith(SITE_DIR)) {
    res.writeHead(403)
    return res.end('Forbidden')
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html')
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      return res.end('404 — not here. Try index.html')
    }
    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' })
    res.end(data)
  })
})

server.listen(PORT, () => {
  console.log('Serving ' + SITE_DIR + ' at http://localhost:' + PORT)
  console.log('Ctrl+C to stop. Nothing leaves your machine.')
})
