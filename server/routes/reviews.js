import { Router } from 'express'
import { all, get, run } from '../db.js'
import { requireAdmin } from '../middleware.js'

const router = Router()

function parseJSON(str) {
  try { return JSON.parse(str) } catch { return [] }
}

// GET /api/reviews — list pending edits (admin only)
router.get('/', requireAdmin, (req, res) => {
  const status = req.query.status || 'pending'
  const rows = all(`
    SELECT e.*,
      u.display_name AS submitter_name,
      u.group_name AS submitter_group,
      f.name AS original_name
    FROM factor_edits e
    LEFT JOIN users u ON e.submitted_by = u.id
    LEFT JOIN factors f ON e.factor_id = f.id
    WHERE e.status = ?
    ORDER BY e.created_at DESC
  `, [status])

  res.json(rows.map(r => ({
    ...r,
    application_examples: parseJSON(r.application_examples),
    caution_examples: parseJSON(r.caution_examples),
  })))
})

// GET /api/reviews/:id — get single edit with original factor for comparison
router.get('/:id', requireAdmin, (req, res) => {
  const edit = get(`
    SELECT e.*,
      u.display_name AS submitter_name,
      u.group_name AS submitter_group
    FROM factor_edits e
    LEFT JOIN users u ON e.submitted_by = u.id
    WHERE e.id = ?
  `, [req.params.id])
  if (!edit) return res.status(404).json({ error: '审核记录不存在' })

  const original = get('SELECT * FROM factors WHERE id = ?', [edit.factor_id])

  res.json({
    edit: { ...edit, application_examples: parseJSON(edit.application_examples), caution_examples: parseJSON(edit.caution_examples) },
    original: original ? { ...original, application_examples: parseJSON(original.application_examples), caution_examples: parseJSON(original.caution_examples) } : null
  })
})

// POST /api/reviews/:id/approve — apply edit to factor
router.post('/:id/approve', requireAdmin, (req, res) => {
  const edit = get('SELECT * FROM factor_edits WHERE id = ? AND status = ?', [req.params.id, 'pending'])
  if (!edit) return res.status(404).json({ error: '审核记录不存在或已处理' })

  // Apply the edit to the factor
  run(
    `UPDATE factors SET name=?, type=?, value=?, unit=?, source=?, version=?, year=?,
      spatial_scope=?, spatial_note=?, boundary_note=?, application_examples=?, caution_examples=?,
      usage_notes=?, updated_at=datetime('now','localtime')
    WHERE id=?`,
    [edit.name, edit.type, edit.value, edit.unit, edit.source, edit.version, edit.year,
      edit.spatial_scope, edit.spatial_note, edit.boundary_note,
      edit.application_examples, edit.caution_examples,
      edit.usage_notes, edit.factor_id]
  )

  // Mark edit as approved
  run(
    "UPDATE factor_edits SET status='approved', reviewed_at=datetime('now','localtime'), reviewed_by=? WHERE id=?",
    [req.user.id, req.params.id]
  )

  res.json({ ok: true, message: '已通过，因子已更新' })
})

// POST /api/reviews/:id/reject — reject with reason
router.post('/:id/reject', requireAdmin, (req, res) => {
  const edit = get('SELECT * FROM factor_edits WHERE id = ? AND status = ?', [req.params.id, 'pending'])
  if (!edit) return res.status(404).json({ error: '审核记录不存在或已处理' })

  const { reason } = req.body

  run(
    "UPDATE factor_edits SET status='rejected', reject_reason=?, reviewed_at=datetime('now','localtime'), reviewed_by=? WHERE id=?",
    [reason || '', req.user.id, req.params.id]
  )

  res.json({ ok: true, message: '已驳回' })
})

export default router
