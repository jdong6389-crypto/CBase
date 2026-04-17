import { Router } from 'express'
import { all, get, run } from '../db.js'
import { requireAuth } from '../middleware.js'

const router = Router()

function uid(prefix) {
  const t = Date.now().toString().slice(-6)
  const r = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}${t}${r}`
}

// ==================== Packages ====================

// GET /api/packages
router.get('/', (req, res) => {
  const rows = all(`
    SELECT p.*, u.display_name as creator_name,
      (SELECT COUNT(*) FROM usages WHERE package_id = p.id) as usage_count
    FROM packages p
    LEFT JOIN users u ON p.created_by = u.id
    ORDER BY p.created_at DESC
  `)
  res.json(rows)
})

// POST /api/packages
router.post('/', requireAuth, (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: '请填写因子包名称' })

  const id = uid('PKG_')
  run('INSERT INTO packages (id, name, created_by) VALUES (?, ?, ?)', [id, name.trim(), req.user.id])

  const row = get('SELECT * FROM packages WHERE id = ?', [id])
  res.json(row)
})

// PUT /api/packages/:id
router.put('/:id', requireAuth, (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: '名称不能为空' })

  const existing = get('SELECT * FROM packages WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: '因子包不存在' })

  run('UPDATE packages SET name = ? WHERE id = ?', [name.trim(), req.params.id])
  res.json({ ...existing, name: name.trim() })
})

// DELETE /api/packages/:id
router.delete('/:id', requireAuth, (req, res) => {
  const existing = get('SELECT * FROM packages WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: '因子包不存在' })

  run('DELETE FROM usages WHERE package_id = ?', [req.params.id])
  run('DELETE FROM packages WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

// ==================== Usages ====================

// GET /api/packages/:pkgId/usages
router.get('/:pkgId/usages', (req, res) => {
  const rows = all(`
    SELECT u.*, f.name as factor_name, f.type as factor_type, f.unit as factor_unit, f.value as factor_value
    FROM usages u
    LEFT JOIN factors f ON u.factor_id = f.id
    WHERE u.package_id = ?
    ORDER BY CASE u.stage
      WHEN 'raw' THEN 1 WHEN 'construction' THEN 2
      WHEN 'operation' THEN 3 WHEN 'end' THEN 4 ELSE 9 END
  `, [req.params.pkgId])
  res.json(rows)
})

// POST /api/packages/:pkgId/usages
router.post('/:pkgId/usages', requireAuth, (req, res) => {
  const pkg = get('SELECT * FROM packages WHERE id = ?', [req.params.pkgId])
  if (!pkg) return res.status(404).json({ error: '因子包不存在' })

  const { factorId, obj, stage, process, note } = req.body
  if (!factorId) return res.status(400).json({ error: '请选择因子' })

  const id = uid('U_')
  run(
    'INSERT INTO usages (id, package_id, factor_id, obj, stage, process, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, req.params.pkgId, factorId, obj || '', stage || '', process || '', note || '']
  )

  const row = get(`
    SELECT u.*, f.name as factor_name, f.type as factor_type, f.unit as factor_unit, f.value as factor_value
    FROM usages u LEFT JOIN factors f ON u.factor_id = f.id WHERE u.id = ?
  `, [id])
  res.json(row)
})

// PUT /api/packages/:pkgId/usages/:usageId
router.put('/:pkgId/usages/:usageId', requireAuth, (req, res) => {
  const existing = get('SELECT * FROM usages WHERE id = ?', [req.params.usageId])
  if (!existing) return res.status(404).json({ error: '使用项不存在' })

  const { obj, stage, process, note } = req.body
  run('UPDATE usages SET obj=?, stage=?, process=?, note=? WHERE id=?',
    [obj ?? existing.obj, stage ?? existing.stage,
      process ?? existing.process, note ?? existing.note, req.params.usageId]
  )
  res.json({ ok: true })
})

// DELETE /api/packages/:pkgId/usages/:usageId
router.delete('/:pkgId/usages/:usageId', requireAuth, (req, res) => {
  run('DELETE FROM usages WHERE id = ?', [req.params.usageId])
  res.json({ ok: true })
})

export default router
