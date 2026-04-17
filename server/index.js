import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { authMiddleware } from './middleware.js'
import authRoutes from './routes/auth.js'
import factorRoutes from './routes/factors.js'
import packageRoutes from './routes/packages.js'
import reviewRoutes from './routes/reviews.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())
app.use(authMiddleware)

app.use('/api/auth', authRoutes)
app.use('/api/factors', factorRoutes)
app.use('/api/packages', packageRoutes)
app.use('/api/reviews', reviewRoutes)

// Production: serve built frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`CBase server running at http://localhost:${PORT}`)
})
