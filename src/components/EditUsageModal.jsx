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
        <div className="fd-header">
          <span className="fd-header-title">
            <i className="fa-solid fa-pen-to-square" style={{ marginRight: 6 }}></i>
            编辑使用项
          </span>
          <button className="fd-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>

        <div className="fd-body">
          <div style={{ fontSize: '0.75rem', color: '#a39e98', marginBottom: 4 }}>
            使用项 ID：<span className="mono">{usage.id}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'rgba(0,0,0,0.88)', marginBottom: 14 }}>
            {usage.factor_name || usage.factorId || '-'}
          </div>

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
                placeholder="例如：混凝土浇筑 / 运输..." />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="fd-form-label">备注（可选）</label>
            <input className="fd-input" style={{ width: '100%' }} value={note} onChange={e => setNote(e.target.value)}
              placeholder="可选" />
          </div>

          <div className="atpk-tip">
            仅修改"使用归类"，不会更改因子本体数值或口径。
          </div>
        </div>

        <div className="fd-footer">
          <span></span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="fd-btn-close" onClick={onClose}>取消</button>
            <button className="fd-btn-save" onClick={handleSave} disabled={loading}>
              <i className="fa-solid fa-check" style={{ marginRight: 6 }}></i>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
