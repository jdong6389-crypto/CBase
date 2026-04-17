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
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">
            <i className="fa-solid fa-square-plus text-primary me-2"></i>添加到因子包（创建使用项）
          </h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="p-3">
          <div className="row g-3">
            {/* Left: factor info or factor selector */}
            <div className="col-md-5 border-end">
              {needSelect ? (
                <>
                  <div className="small fw-bold mb-2">选择因子</div>
                  <input
                    className="form-control form-control-sm mb-2"
                    placeholder="搜索因子名称..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                  />
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {filteredFactors.map(f => (
                      <div
                        key={f.id}
                        className={`p-2 border-bottom small${selectedFactorId === f.id ? ' bg-primary text-white' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedFactorId(f.id)}
                      >
                        <div className="fw-bold">{f.name}</div>
                        <div className={selectedFactorId === f.id ? 'text-white-50' : 'text-muted'}>
                          {typeLabel(f.type)} | {f.unit || '-'}
                        </div>
                      </div>
                    ))}
                    {filteredFactors.length === 0 && (
                      <div className="p-2 small text-muted">未找到匹配因子</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="small muted">将要引用的因子（本体唯一）</div>
                  <div className="fw-bold mt-1">{actualFactor?.name}</div>
                  <div className="mt-2">
                    <span className="pill"><i className="fa-solid fa-tag"></i>{typeLabel(actualFactor?.type)}</span>
                    <span className="pill ms-2"><i className="fa-solid fa-ruler"></i>{actualFactor?.unit || '-'}</span>
                  </div>
                  <div className="mt-2 small muted">来源/版本：{actualFactor?.source || '-'}{actualFactor?.version ? ` / ${actualFactor.version}` : ''}</div>
                </>
              )}
              <hr />
              <div className="small muted">说明：这里不会修改因子本体，只会在因子包里创建一个"使用项"。</div>
            </div>

            {/* Right: usage classification */}
            <div className="col-md-7">
              <div className="row g-2">
                <div className="col-12">
                  <label className="form-label small fw-bold">选择因子包</label>
                  <select className="form-select" value={pkgId} onChange={e => setPkgId(e.target.value)}>
                    {packages.length === 0 && <option value="">（暂无因子包，请先创建）</option>}
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>{p.name}（{p.id}）</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">工程对象</label>
                  <select className="form-select" value={obj} onChange={e => setObj(e.target.value)}>
                    <option value="road">公路工程</option>
                    <option value="waterway">水路工程</option>
                    <option value="general">通用</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">生命周期阶段</label>
                  <select className="form-select" value={stage} onChange={e => setStage(e.target.value)}>
                    <option value="raw">原料与材料阶段</option>
                    <option value="construction">施工阶段</option>
                    <option value="operation">运营与维护阶段</option>
                    <option value="end">报废与回收阶段</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">过程/工序</label>
                  <input className="form-control" value={process} onChange={e => setProcess(e.target.value)}
                    placeholder="例如：路基土石方 / 沥青拌合..." />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-bold">备注（可选）</label>
                  <input className="form-control" value={note} onChange={e => setNote(e.target.value)}
                    placeholder="例如：按定额/按现场台班..." />
                </div>
                <div className="col-12">
                  <div className="alert alert-primary py-2 mb-0 small">
                    你现在做的"归类"，只发生在<strong>因子包</strong>中：方便后续直接用于计算与追溯。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-top d-flex justify-content-end gap-2">
          <button className="btn btn-outline-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            <i className="fa-solid fa-check me-1"></i> {loading ? '创建中...' : '创建使用项'}
          </button>
        </div>
      </div>
    </div>
  )
}
