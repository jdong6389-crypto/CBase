import { createServer } from 'http'
import { createHmac } from 'crypto'
import { exec } from 'child_process'

const SECRET = process.env.WEBHOOK_SECRET || 'cbase-deploy-2026'
const PORT = 9000
const PROJECT_DIR = '/home/CBase'

createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404)
    res.end()
    return
  }

  let body = ''
  req.on('data', c => body += c)
  req.on('end', () => {
    // Verify GitHub signature
    const sig = req.headers['x-hub-signature-256']
    if (sig) {
      const expected = 'sha256=' + createHmac('sha256', SECRET).update(body).digest('hex')
      if (sig !== expected) {
        console.log(`[${new Date().toISOString()}] Bad signature, rejected`)
        res.writeHead(403)
        res.end('bad signature')
        return
      }
    }

    console.log(`[${new Date().toISOString()}] Deploy triggered`)
    res.writeHead(200)
    res.end('ok')

    // Run deploy script asynchronously
    exec(`bash ${PROJECT_DIR}/deploy.sh >> ${PROJECT_DIR}/deploy.log 2>&1`, (err) => {
      if (err) console.error(`[${new Date().toISOString()}] Deploy failed:`, err.message)
      else console.log(`[${new Date().toISOString()}] Deploy finished`)
    })
  })
}).listen(PORT, () => {
  console.log(`Webhook listener running on port ${PORT}`)
})
