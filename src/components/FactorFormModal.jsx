import { useState, useEffect } from 'react'
import { FACTOR_TYPES } from '../App.jsx'

const EMPTY = {
  type: 'energy', name: '', value: '', unit: '', source: '', version: '', year: '',
  spatial_scope: '', spatial_note: '', boundary_note: '',
  application_examples: [], caution_examples: [], usage_notes: ''
}

export default function FactorFormModal({ factor, onClose, onSave }) {
  const isEdit = !!factor
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (factor) {
      setForm({
        type: factor.type || 'energy',
        name: factor.name || '',
        value: factor.value ?? '',
        unit: factor.unit || '',
        source: factor.source || '',
        version: factor.version || '',
        year: factor.year || '',
        spatial_scope: factor.spatial_scope || '',
        spatial_note: factor.spatial_note || '',
        boundary_note: factor.boundary_note || '',
        application_examples: factor.application_examples || [],
        caution_examples: factor.caution_examples || [],
        usage_notes: factor.usage_notes || ''
      })
    } else {
      setForm(EMPTY)
    }
  }, [factor])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('因子名称为必填项'); return }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
    } catch (e) {
      setError(e.message || '保存失败')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box lg" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">
            <i className={`fa-solid ${isEdit ? 'fa-pen-to-square' : 'fa-plus-circle'} text-primary me-2`}></i>
            {isEdit ? '编辑因子' : '新增因子'}
          </h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="p-3" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

          {/* 基本信息 */}
          <div className="detail-box mb-3">
            <div className="detail-section-title">基本信息</div>
            <div className="row g-2 mt-1">
              <div className="col-md-8">
                <label className="form-label small fw-bold">因子名称 <span className="text-danger">*</span></label>
                <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="如：柴油燃烧（CO₂）" />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">因子类型</label>
                <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                  {FACTOR_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 数值与单位 */}
          <div className="detail-box mb-3">
            <div className="detail-section-title">数值与单位</div>
            <div className="row g-2 mt-1">
              <div className="col-md-4">
                <label className="form-label small fw-bold">数值</label>
                <input className="form-control" type="number" step="any" value={form.value}
                  onChange={e => set('value', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="如：3.096" />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">单位</label>
                <input className="form-control" value={form.unit} onChange={e => set('unit', e.target.value)}
                  placeholder="如：kgCO₂e/kg" />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">年份</label>
                <input className="form-control" value={form.year} onChange={e => set('year', e.target.value)}
                  placeholder="如：2022" />
              </div>
            </div>
          </div>

          {/* 来源信息 */}
          <div className="detail-box mb-3">
            <div className="detail-section-title">来源 / 版本信息</div>
            <div className="row g-2 mt-1">
              <div className="col-md-6">
                <label className="form-label small fw-bold">来源/出处</label>
                <input className="form-control" value={form.source} onChange={e => set('source', e.target.value)}
                  placeholder="如：IPCC 2006 / 中国统计年鉴" />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">版本</label>
                <input className="form-control" value={form.version} onChange={e => set('version', e.target.value)}
                  placeholder="如：V2.1" />
              </div>
            </div>
          </div>

          {/* 空间适用范围 */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="detail-box h-100">
                <div className="detail-section-title">空间适用范围</div>
                <label className="form-label small fw-bold mt-1">空间范围</label>
                <input className="form-control" value={form.spatial_scope} onChange={e => set('spatial_scope', e.target.value)}
                  placeholder="如：中国大陆" />
                <label className="form-label small fw-bold mt-2">空间说明</label>
                <input className="form-control" value={form.spatial_note} onChange={e => set('spatial_note', e.target.value)}
                  placeholder="如：仅限华东电网" />
              </div>
            </div>
            <div className="col-md-6">
              <div className="detail-box h-100">
                <div className="detail-section-title">边界与口径说明</div>
                <textarea className="form-control mt-1" rows="4" value={form.boundary_note}
                  onChange={e => set('boundary_note', e.target.value)}
                  placeholder="描述因子的核算边界、方法学..." />
              </div>
            </div>
          </div>

          {/* 使用说明 */}
          <div className="detail-box">
            <div className="detail-section-title">使用说明</div>
            <textarea className="form-control mt-1" rows="2" value={form.usage_notes}
              onChange={e => set('usage_notes', e.target.value)}
              placeholder="补充说明、注意事项..." />
          </div>
        </div>

        <div className="p-3 border-top d-flex justify-content-end gap-2">
          <button className="btn btn-outline-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            <i className={`fa-solid ${isEdit ? 'fa-check' : 'fa-plus'} me-1`}></i>
            {saving ? '保存中...' : (isEdit ? '提交修改' : '创建因子')}
          </button>
        </div>
      </div>
    </div>
  )
}
