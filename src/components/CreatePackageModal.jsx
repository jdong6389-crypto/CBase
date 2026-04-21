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
        <div className="fd-header">
          <span className="fd-header-title">
            <i className="fa-solid fa-box-open" style={{ marginRight: 6 }}></i>
            新建因子包
          </span>
          <button className="fd-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>

        <div className="fd-body">
          <label className="fd-form-label">因子包名称</label>
          <input
            className="fd-input"
            style={{ width: '100%' }}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例如：公路工程-施工阶段核算包"
            onKeyPress={e => e.key === 'Enter' && handleSubmit()}
          />
          <div style={{ fontSize: '0.75rem', color: '#a39e98', marginTop: 8, lineHeight: 1.5 }}>
            提示：因子包用于"把因子放到你的工程过程里"，后续可导出给计算模块。
          </div>
        </div>

        <div className="fd-footer">
          <span></span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="fd-btn-close" onClick={onClose}>取消</button>
            <button className="fd-btn-save" onClick={handleSubmit} disabled={loading}>
              <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
