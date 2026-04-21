import { useState } from 'react'
import api from '../api.js'
import { typeLabel } from '../App.jsx'

export default function AddToPackageModal({ factor, factors, packages, preferPackageId, onClose, onCreated }) {
  const needSelect = factor?._selectFromAll
  const [selectedFactorId, setSelectedFactorId] = useState('')
  const [pkgId, setPkgId] = useState(preferPackageId || (packages[0]?.id || ''))
  const [obj, setObj] = useState('road')
  const [stage, setStage] = useState('construction')
  const [process, setProcess] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const actualFactor = needSelect
    ? (factors || []).find(f => f.id === selectedFactorId)
    : factor

  const filteredFactors = (factors || []).filter(f => {
    if (!searchQ.trim()) return true
    const hay = `${f.name} ${f.source} ${f.unit} ${f.id}`.toLowerCase()
    return hay.includes(searchQ.trim().toLowerCase())
  })

  const handleSubmit = async () => {
    if (!actualFactor) return alert('请先选择一个因子')
    if (!pkgId) return alert('暂无因子包，请先创建因子包。')
    setLoading(true)
    try {
      await api.createUsage(pkgId, {
        factorId: actualFactor.id,
        obj, stage, process, note
      })
      onCreated(pkgId)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="fd-header">
          <span className="fd-header-title">
            <i className="fa-solid fa-plus-circle" style={{ marginRight: 6 }}></i>
            添加到因子包（创建使用项）
          </span>
          <button className="fd-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>

        <div className="fd-body">
          <div style={{ display: 'flex', gap: 20 }}>
            {/* Left: factor info or selector */}
            <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.1)', paddingRight: 20 }}>
              {needSelect ? (
                <>
                  <div className="fd-section-label">选择因子</div>
                  <input
                    className="fd-input"
                    style={{ width: '100%', marginBottom: 10 }}
                    placeholder="搜索因子名称..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                  />
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {filteredFactors.map(f => (
                      <div
                        key={f.id}
                        className={`atpk-factor-item${selectedFactorId === f.id ? ' atpk-factor-active' : ''}`}
                        onClick={() => setSelectedFactorId(f.id)}
                      >
                        <div className="atpk-factor-name">{f.name}</div>
                        <div className="atpk-factor-sub">{typeLabel(f.type)} · {f.unit || '-'}</div>
                      </div>
                    ))}
                    {filteredFactors.length === 0 && (
                      <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '0.8rem', color: '#a39e98' }}>未找到匹配因子</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="fd-section-label">引用因子</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'rgba(0,0,0,0.88)', marginBottom: 6 }}>{actualFactor?.name}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="lib-tag">{typeLabel(actualFactor?.type)}</span>
                    <span className="lib-tag">{actualFactor?.unit || '-'}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#a39e98', marginTop: 8 }}>
                    来源：{actualFactor?.source || '-'}{actualFactor?.version ? ` / ${actualFactor.version}` : ''}
                  </div>
                </>
              )}
              <div className="fd-divider"></div>
              <div style={{ fontSize: '0.75rem', color: '#a39e98', lineHeight: 1.5 }}>
                说明：这里不会修改因子本体，只会在因子包里创建一个"使用项"。
              </div>
            </div>

            {/* Right: usage classification */}
            <div style={{ flex: 1 }}>
              <div className="fd-section-label">选择因子包</div>
              <select className="fd-input" style={{ width: '100%', marginBottom: 14 }} value={pkgId} onChange={e => setPkgId(e.target.value)}>
                {packages.length === 0 && <option value="">（暂无因子包，请先创建）</option>}
                {packages.map(p => (
                  <option key={p.id} value={p.id}>{p.name}（{p.id}）</option>
                ))}
              </select>

              <div className="fd-form-row" style={{ marginBottom: 12 }}>
                <div className="fd-form-field">
                  <label className="fd-form-label">工程对象</label>
                  <select className="fd-input" value={obj} onChange={e => setObj(e.target.value)}>
                    <option value="road">公路工程</option>
                    <option value="waterway">水路工程</option>
                    <option value="general">通用</option>
                  </select>
                </div>
                <div className="fd-form-field">
                  <label className="fd-form-label">生命周期阶段</label>
                  <select className="fd-input" value={stage} onChange={e => setStage(e.target.value)}>
                    <option value="raw">原料与材料阶段</option>
                    <option value="construction">施工阶段</option>
                    <option value="operation">运营与维护阶段</option>
                    <option value="end">报废与回收阶段</option>
                  </select>
                </div>
                <div className="fd-form-field">
                  <label className="fd-form-label">过程/工序</label>
                  <input className="fd-input" value={process} onChange={e => setProcess(e.target.value)}
                    placeholder="例如：路基土石方" />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="fd-form-label">备注（可选）</label>
                <input className="fd-input" style={{ width: '100%' }} value={note} onChange={e => setNote(e.target.value)}
                  placeholder="例如：按定额/按现场台班..." />
              </div>

              <div className="atpk-tip">
                你现在做的"归类"，只发生在<strong>因子包</strong>中：方便后续直接用于计算与追溯。
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fd-footer">
          <span></span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="fd-btn-close" onClick={onClose}>取消</button>
            <button className="fd-btn-save" onClick={handleSubmit} disabled={loading}>
              <i className="fa-solid fa-check" style={{ marginRight: 6 }}></i>
              {loading ? '创建中...' : '创建使用项'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
