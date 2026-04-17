import { all, get } from './db.js'

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    req.user = null
    return next()
  }
  const session = get(`
    SELECT u.id, u.username, u.display_name, u.group_name, u.role
    FROM sessions s JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `, [token])

  req.user = session ? {
    id: session.id,
    username: session.username,
    displayName: session.display_name,
    groupName: session.group_name,
    role: session.role
  } : null
  next()
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '请先登录' })
  }
  next()
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '请先登录' })
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' })
  }
  next()
}
