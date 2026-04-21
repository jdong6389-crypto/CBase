import { useState, useEffect } from 'react'
import { FACTOR_TYPES } from '../App.jsx'

const SOURCE_OPTIONS = [
  { value: 'IPCC', label: 'IPCC' },
  { value: 'CLCD', label: 'CLCD（中国生命周期数据库）' },
  { value: '生态环境部', label: '生态环境部' },
  { value: '统计年鉴', label: '中国统计年鉴' },
  { value: '文献', label: '文献' },
  { value: '自定义', label: '自定义' },
]

const EMPTY = {
  type: 'energy', name: '', value: '', unit: '', source: '', source_citation: '',
  version: '', year: '',
  spatial_scope: '', spatial_note: '', boundary_note: '',
  application_examples: [], caution_examples: [], usage_notes: ''
}

function getSourceType(source) {
  if (!source) return ''
  const match = SOURCE_OPTIONS.find(o => o.value === source)
  return match ? match.value : '自定义'
}

// 把 boundary_note 文本解析为结构化条目
function parseBoundaryToItems(raw) {
  if (!raw) return []
  const items = []
  const parts = raw.split(/[；;。]/).map(s => s.trim()).filter(Boolean)
  for (const p of parts) {
    if (p.startsWith('不包括') || p.startsWith('不含') || p.startsWith('不包含') || p.startsWith('未包括') || p.startsWith('不涵盖')) {
      const content = p.replace(/^(不包括|不含|不包含|未包括|不涵盖)/, '').trim()
      const subs = content.split(/[、,，]/).map(s => s.trim()).filter(Boolean)
      subs.forEach(s => items.push({ text: s, included: false }))
    } else {
      const content = p.replace(/^(仅包括|包括|仅包含|包含|涵盖|仅涵盖)/, '').trim()
      if (content) items.push({ text: content, included: true })
    }
  }
  return items
}

// 把结构化条目序列化回 boundary_note 文本
function itemsToBoundary(items) {
  const inc = items.filter(i => i.included).map(i => i.text)
  const exc = items.filter(i => !i.included).map(i => i.text)
  const parts = []
  if (inc.length) parts.push('包括' + inc.join('、'))
  if (exc.length) parts.push('不包括' + exc.join('、'))
  return parts.join('；')
}

// 动态列表组件：增减条目
function DynamicList({ items, onChange, placeholder }) {
  const add = () => onChange([...items, ''])
  const update = (i, val) => { const a = [...items]; a[i] = val; onChange(a) }
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div className="fd-dynamic-list">
      {items.map((item, i) => (
        <div key={i} className="fd-dyn-row">
          <input className="fd-input fd-dyn-input" value={item}
            onChange={e => update(i, e.target.value)}
            placeholder={placeholder} />
          <button type="button" className="fd-dyn-remove" onClick={() => remove(i)}
            title="删除"><i className="fa-solid fa-xmark"></i></button>
        </div>
      ))}
      <button type="button" className="fd-dyn-add" onClick={add}>
        <i className="fa-solid fa-plus"></i> 添加一条
      </button>
    </div>
  )
}

// 工艺代表性条目列表：每条可切换包含/不包含
function BoundaryList({ items, onChange }) {
  const add = () => onChange([...items, { text: '', included: true }])
  const update = (i, key, val) => {
    const a = [...items]; a[i] = { ...a[i], [key]: val }; onChange(a)
  }
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div className="fd-dynamic-list">
      {items.map((item, i) => (
        <div key={i} className="fd-dyn-row">
          <button type="button"
            className={`fd-bd-toggle ${item.included ? 'fd-bd-toggle-inc' : 'fd-bd-toggle-exc'}`}
            onClick={() => update(i, 'included', !item.included)}
            title={item.included ? '包含（点击切换）' : '不包含（点击切换）'}>
            <i className={`fa-solid ${item.included ? 'fa-check' : 'fa-xmark'}`}></i>
          </button>
          <input className="fd-input fd-dyn-input" value={item.text}
            onChange={e => update(i, 'text', e.target.value)}
            placeholder={item.included ? '包含的工艺/环节' : '不包含的工艺/环节'} />
          <button type="button" className="fd-dyn-remove" onClick={() => remove(i)}
            title="删除"><i className="fa-solid fa-trash-can"></i></button>
        </div>
      ))}
      <button type="button" className="fd-dyn-add" onClick={add}>
        <i className="fa-solid fa-plus"></i> 添加一条
      </button>
    </div>
  )
}

export default function FactorFormModal({ factor, onClose, onSave }) {
  const isEdit = !!factor
  const [form, setForm] = useState(EMPTY)
  const [sourceType, setSourceType] = useState('')
  const [boundaryItems, setBoundaryItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (factor) {
      const f = {
        type: factor.type || 'energy',
        name: factor.name || '',
        value: factor.value ?? '',
        unit: factor.unit || '',
        source: factor.source || '',
        source_citation: factor.source_citation || '',
        version: factor.version || '',
        year: factor.year || '',
        spatial_scope: factor.spatial_scope || '',
        spatial_note: factor.spatial_note || '',
        boundary_note: factor.boundary_note || '',
        application_examples: factor.application_examples || [],
        caution_examples: factor.caution_examples || [],
        usage_notes: factor.usage_notes || ''
      }
      setForm(f)
      setSourceType(getSourceType(f.source))
      setBoundaryItems(parseBoundaryToItems(f.boundary_note))
    } else {
      setForm(EMPTY)
      setSourceType('')
      setBoundaryItems([])
    }
  }, [factor])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSourceTypeChange = (val) => {
    setSourceType(val)
    if (val === '自定义') {
      set('source', '')
    } else if (val === '文献') {
      set('source', '文献')
    } else {
      set('source', val)
      set('source_citation', '')
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('因子名称为必填项'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        boundary_note: itemsToBoundary(boundaryItems.filter(i => i.text.trim())),
      }
      await onSave(payload)
    } catch (e) {
      setError(e.message || '保存失败')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="fd-header">
          <span className="fd-header-title">
            <i className={`fa-solid ${isEdit ? 'fa-pen-to-square' : 'fa-plus-circle'}`} style={{ marginRight: 6 }}></i>
            {isEdit ? '编辑因子' : '新增因子'}
          </span>
          <button className="fd-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>

        {/* Body */}
        <div className="fd-body">
          {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

          {/* ====== 基本信息 ====== */}
          <div className="fd-section-label">基本信息</div>
          <div className="fd-form-grid">
            <div className="fd-form-row">
              <div className="fd-form-field" style={{ flex: 2 }}>
                <label className="fd-form-label">因子名称 <span style={{ color: '#c96442' }}>*</span></label>
                <input className="fd-input" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="如：柴油燃烧（CO₂）" />
              </div>
              <div className="fd-form-field" style={{ flex: 1 }}>
                <label className="fd-form-label">因子类型</label>
                <select className="fd-input" value={form.type} onChange={e => set('type', e.target.value)}>
                  {FACTOR_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="fd-divider"></div>

          {/* ====== 数值与单位 ====== */}
          <div className="fd-section-label">数值与单位</div>
          <div className="fd-form-grid">
            <div className="fd-form-row">
              <div className="fd-form-field">
                <label className="fd-form-label">数值</label>
                <input className="fd-input" type="number" step="any" value={form.value}
                  onChange={e => set('value', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="如：3.096" />
              </div>
              <div className="fd-form-field">
                <label className="fd-form-label">单位</label>
                <input className="fd-input" value={form.unit} onChange={e => set('unit', e.target.value)}
                  placeholder="如：kgCO₂e/kg" />
              </div>
            </div>
          </div>

          <div className="fd-divider"></div>

          {/* ====== 来源 / 版本信息 ====== */}
          <div className="fd-section-label">来源 / 版本信息</div>
          <div className="fd-form-grid">
            <div className="fd-form-row">
              <div className="fd-form-field">
                <label className="fd-form-label">来源类型</label>
                <select className="fd-input" value={sourceType} onChange={e => handleSourceTypeChange(e.target.value)}>
                  <option value="">请选择来源类型</option>
                  {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {sourceType === '自定义' && (
                <div className="fd-form-field">
                  <label className="fd-form-label">来源名称</label>
                  <input className="fd-input" value={form.source} onChange={e => set('source', e.target.value)}
                    placeholder="输入自定义来源名称" />
                </div>
              )}
              <div className="fd-form-field">
                <label className="fd-form-label">版本</label>
                <input className="fd-input" value={form.version} onChange={e => set('version', e.target.value)}
                  placeholder="如：V2.1" />
              </div>
            </div>
            {sourceType === '文献' && (
              <div className="fd-form-row" style={{ marginTop: 10 }}>
                <div className="fd-form-field" style={{ flex: 1 }}>
                  <label className="fd-form-label">文献引用</label>
                  <textarea className="fd-input" rows="2" value={form.source_citation}
                    onChange={e => set('source_citation', e.target.value)}
                    placeholder="如：张三, 李四. 某研究论文标题[J]. 期刊名, 2023, 12(3): 45-52." />
                </div>
              </div>
            )}
          </div>

          <div className="fd-divider"></div>

          {/* ====== 适用性评估 ====== */}
          <div className="fd-section-label">适用性评估</div>

          {/* 时间 + 空间 两列 */}
          <div className="fd-rep-grid" style={{ marginBottom: 10 }}>
            <div className="fd-rep-card">
              <div className="fd-rep-head">
                <i className="fa-regular fa-calendar"></i>
                <span>时间代表性</span>
              </div>
              <input className="fd-input" value={form.year} onChange={e => set('year', e.target.value)}
                placeholder="如：2022" style={{ marginTop: 4 }} />
            </div>
            <div className="fd-rep-card">
              <div className="fd-rep-head">
                <i className="fa-solid fa-location-dot"></i>
                <span>空间代表性</span>
              </div>
              <input className="fd-input" value={form.spatial_scope} onChange={e => set('spatial_scope', e.target.value)}
                placeholder="如：中国大陆" style={{ marginTop: 4 }} />
              <input className="fd-input" value={form.spatial_note} onChange={e => set('spatial_note', e.target.value)}
                placeholder="补充说明（选填）" style={{ marginTop: 6 }} />
            </div>
          </div>

          {/* 工艺/技术代表性 — 全宽 */}
          <div className="fd-rep-card fd-rep-card-wide">
            <div className="fd-rep-head">
              <i className="fa-solid fa-gears"></i>
              <span>工艺 / 技术代表性</span>
            </div>
            <BoundaryList items={boundaryItems} onChange={setBoundaryItems} />
          </div>

          <div className="fd-divider"></div>

          {/* ====== 典型应用场景 ====== */}
          <div className="fd-section-label">典型应用场景</div>
          <DynamicList
            items={form.application_examples}
            onChange={val => set('application_examples', val)}
            placeholder="描述一个应用场景" />

          <div className="fd-divider"></div>

          {/* ====== 不适用场景 / 注意事项 ====== */}
          <div className="fd-section-label">不适用场景 / 注意事项</div>
          <DynamicList
            items={form.caution_examples}
            onChange={val => set('caution_examples', val)}
            placeholder="描述一个不适用场景或注意事项" />

          {/* 补充说明 */}
          <div style={{ marginTop: 10 }}>
            <label className="fd-form-label">补充说明</label>
            <textarea className="fd-input" rows="2" value={form.usage_notes}
              onChange={e => set('usage_notes', e.target.value)}
              placeholder="其他补充说明..." style={{ width: '100%' }} />
          </div>
        </div>

        {/* Footer */}
        <div className="fd-footer">
          <button className="fd-btn-close" onClick={onClose}>取消</button>
          <button className="fd-btn-save" onClick={handleSubmit} disabled={saving}>
            <i className={`fa-solid ${isEdit ? 'fa-check' : 'fa-plus'}`} style={{ marginRight: 6 }}></i>
            {saving ? '保存中...' : (isEdit ? '提交修改' : '创建因子')}
          </button>
        </div>
      </div>
    </div>
  )
}
