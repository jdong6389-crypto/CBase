import { useState } from 'react'
import api from '../api.js'

export default function EditUsageModal({ usage, onClose, onSaved }) {
  const [obj, setObj] = useState(usage.obj || 'road')
  const [stage, setStage] = useState(usage.stage || 'construction')
  const [process, setProcess] = useState(usage.process || '')
  const [note, setNote] = useState(usage.note || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.updateUsage(usage.packageId || usage.package_id, usage.id, { obj, stage, process, note })
      onSaved()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">
            <i className="fa-solid fa-pen-to-square text-primary me-2"></i>编辑使用项
          </h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        <div className="p-3">
          <div className="small muted">使用项 ID：<span className="mono">{usage.id}</span></div>
          <div className="fw-bold mt-1">{usage.factor_name || usage.factorId || '-'}</div>

          <div className="row g-2 mt-2">
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
                placeholder="例如：混凝土浇筑 / 运输..." />
            </div>
            <div className="col-12">
              <label className="form-label small fw-bold">备注</label>
              <input className="form-control" value={note} onChange={e => setNote(e.target.value)} placeholder="可选" />
            </div>
          </div>

          <div className="alert alert-warning py-2 mt-3 mb-0 small">
            仅修改"使用归类"，不会更改因子本体数值或口径。
          </div>
        </div>
        <div className="p-3 border-top d-flex justify-content-end gap-2">
          <button className="btn btn-outline-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            <i className="fa-solid fa-save me-1"></i> {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
