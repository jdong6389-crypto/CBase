import { Router } from 'express'
import { all, get, run } from '../db.js'
import { requireAuth, requireAdmin } from '../middleware.js'

const router = Router()

function uid(prefix) {
  const t = Date.now().toString().slice(-6)
  const r = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}${t}${r}`
}

function parseJSON(str) {
  try { return JSON.parse(str) } catch { return [] }
}

function formatFactor(row) {
  return {
    ...row,
    application_examples: parseJSON(row.application_examples),
    caution_examples: parseJSON(row.caution_examples),
  }
}

// GET /api/factors — include usage_count + creator info
router.get('/', (req, res) => {
  const { q, type } = req.query
  let sql = `
    SELECT f.*,
      u.display_name AS creator_name,
      u.group_name AS creator_group,
      (SELECT COUNT(*) FROM usages WHERE factor_id = f.id) AS usage_count
    FROM factors f
    LEFT JOIN users u ON f.created_by = u.id
    WHERE 1=1
  `
  const params = []

  if (type) {
    sql += ' AND f.type = ?'
    params.push(type)
  }
  if (q) {
    sql += ' AND (f.name LIKE ? OR f.source LIKE ? OR f.unit LIKE ? OR f.id LIKE ?)'
    const like = `%${q}%`
    params.push(like, like, like, like)
  }

  sql += ' ORDER BY f.type, f.name'
  const rows = all(sql, params)
  res.json(rows.map(formatFactor))
})

// GET /api/factors/:id
router.get('/:id', (req, res) => {
  const row = get(`
    SELECT f.*,
      u.display_name AS creator_name,
      u.group_name AS creator_group,
      (SELECT COUNT(*) FROM usages WHERE factor_id = f.id) AS usage_count
    FROM factors f
    LEFT JOIN users u ON f.created_by = u.id
    WHERE f.id = ?
  `, [req.params.id])
  if (!row) return res.status(404).json({ error: '因子不存在' })
  res.json(formatFactor(row))
})

// POST /api/factors — new factor, direct insert (no review needed)
router.post('/', requireAuth, (req, res) => {
  const f = req.body
  const id = f.id || uid('F')
  run(
    `INSERT INTO factors (id, type, name, value, unit, source, source_citation, version, year,
      spatial_scope, spatial_note, boundary_note, application_examples, caution_examples, usage_notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, f.type, f.name, f.value ?? null, f.unit || '', f.source || '', f.source_citation || '', f.version || '', f.year || '',
      f.spatial_scope || '', f.spatial_note || '', f.boundary_note || '',
      JSON.stringify(f.application_examples || []),
      JSON.stringify(f.caution_examples || []),
      f.usage_notes || '', req.user.id]
  )

  const row = get(`
    SELECT f.*, u.display_name AS creator_name, u.group_name AS creator_group,
      (SELECT COUNT(*) FROM usages WHERE factor_id = f.id) AS usage_count
    FROM factors f LEFT JOIN users u ON f.created_by = u.id WHERE f.id = ?
  `, [id])
  res.json(formatFactor(row))
})

// PUT /api/factors/:id — admin: direct update; editor: submit for review
router.put('/:id', requireAuth, (req, res) => {
  const existing = get('SELECT * FROM factors WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: '因子不存在' })

  const f = req.body

  if (req.user.role === 'admin') {
    // Admin: direct update
    run(
      `UPDATE factors SET type=?, name=?, value=?, unit=?, source=?, source_citation=?, version=?, year=?,
        spatial_scope=?, spatial_note=?, boundary_note=?, application_examples=?, caution_examples=?,
        usage_notes=?, updated_at=datetime('now','localtime')
      WHERE id=?`,
      [f.type ?? existing.type, f.name ?? existing.name, f.value ?? existing.value,
        f.unit ?? existing.unit, f.source ?? existing.source, f.source_citation ?? existing.source_citation ?? '',
        f.version ?? existing.version,
        f.year ?? existing.year, f.spatial_scope ?? existing.spatial_scope,
        f.spatial_note ?? existing.spatial_note, f.boundary_note ?? existing.boundary_note,
        JSON.stringify(f.application_examples || parseJSON(existing.application_examples)),
        JSON.stringify(f.caution_examples || parseJSON(existing.caution_examples)),
        f.usage_notes ?? existing.usage_notes, req.params.id]
    )
    const row = get(`
      SELECT f.*, u.display_name AS creator_name, u.group_name AS creator_group,
        (SELECT COUNT(*) FROM usages WHERE factor_id = f.id) AS usage_count
      FROM factors f LEFT JOIN users u ON f.created_by = u.id WHERE f.id = ?
    `, [req.params.id])
    res.json(formatFactor(row))
  } else {
    // Editor: create a pending edit record
    run(
      `INSERT INTO factor_edits (factor_id, submitted_by, name, type, value, unit, source, source_citation, version, year,
        spatial_scope, spatial_note, boundary_note, application_examples, caution_examples, usage_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, req.user.id,
        f.name ?? existing.name, f.type ?? existing.type, f.value ?? existing.value,
        f.unit ?? existing.unit, f.source ?? existing.source, f.source_citation ?? existing.source_citation ?? '',
        f.version ?? existing.version,
        f.year ?? existing.year, f.spatial_scope ?? existing.spatial_scope,
        f.spatial_note ?? existing.spatial_note, f.boundary_note ?? existing.boundary_note,
        JSON.stringify(f.application_examples || parseJSON(existing.application_examples)),
        JSON.stringify(f.caution_examples || parseJSON(existing.caution_examples)),
        f.usage_notes ?? existing.usage_notes]
    )
    res.json({ pending: true, message: '修改已提交，等待管理员审核' })
  }
})

// DELETE /api/factors/:id — admin only
router.delete('/:id', requireAdmin, (req, res) => {
  const existing = get('SELECT * FROM factors WHERE id = ?', [req.params.id])
  if (!existing) return res.status(404).json({ error: '因子不存在' })
  run('DELETE FROM usages WHERE factor_id = ?', [req.params.id])
  run('DELETE FROM factors WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
