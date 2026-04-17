import { useState } from 'react'
import api from '../api.js'

export default function CreatePackageModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return alert('请填写因子包名称。')
    setLoading(true)
    try {
      const pkg = await api.createPackage({ name: name.trim() })
      onCreated(pkg)
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
            <i className="fa-solid fa-box-open text-primary me-2"></i>新建因子包
          </h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        <div className="p-3">
          <label className="form-label small fw-bold">因子包名称</label>
          <input
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例如：公路工程-施工阶段核算包"
            onKeyPress={e => e.key === 'Enter' && handleSubmit()}
          />
          <div className="small muted mt-2">提示：因子包用于"把因子放到你的工程过程里"，后续可导出给计算模块。</div>
        </div>
        <div className="p-3 border-top d-flex justify-content-end gap-2">
          <button className="btn btn-outline-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
            {loading ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  )
}
