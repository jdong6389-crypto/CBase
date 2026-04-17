import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { all, get, run, insert } from '../db.js'
import { requireAuth, requireAdmin } from '../middleware.js'

const router = Router()

// POST /api/auth/register — admin only
router.post('/register', requireAdmin, (req, res) => {
  const { username, password, displayName, groupName } = req.body
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: '用户名、密码、昵称为必填项' })
  }

  const existing = get('SELECT id FROM users WHERE username = ?', [username])
  if (existing) {
    return res.status(409).json({ error: '用户名已存在' })
  }

  const hash = bcrypt.hashSync(password, 10)
  const userId = insert(
    'INSERT INTO users (username, password_hash, display_name, group_name, role) VALUES (?, ?, ?, ?, ?)',
    [username, hash, displayName, groupName || '', 'editor']
  )

  res.json({
    ok: true,
    user: { id: userId, username, displayName, groupName: groupName || '', role: 'editor' }
  })
})

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' })
  }

  const user = get('SELECT * FROM users WHERE username = ?', [username])
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const token = crypto.randomUUID()
  run('INSERT INTO sessions (user_id, token) VALUES (?, ?)', [user.id, token])

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      groupName: user.group_name,
      role: user.role
    }
  })
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token) {
    run('DELETE FROM sessions WHERE token = ?', [token])
  }
  res.json({ ok: true })
})

export default router
