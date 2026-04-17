import { typeLabel } from '../App.jsx'

export default function FactorDetailModal({ factor, onClose, user, onDelete }) {
  const f = factor
  const version = f.version || ''
  const boundary = f.boundary_note || f.boundary || ''
  const year = f.year || ''
  const spatialScope = f.spatial_scope || ''
  const spatialNote = f.spatial_note || ''
  const spatial = (spatialScope && spatialNote) ? `${spatialScope}（${spatialNote}）` : (spatialScope || spatialNote || '')
  const appList = Array.isArray(f.application_examples) ? f.application_examples : []
  const cautionList = Array.isArray(f.caution_examples) ? f.caution_examples : []
  const usageNotes = f.usage_notes || ''
  const valueUnit = (f.value !== undefined && f.value !== null && f.unit) ? `${Number(f.value)} ${f.unit}` : '-'

  const descLine = [
    f.source ? `来源：${f.source}` : '',
    year ? `年份：${year}` : '',
    spatialScope ? `空间：${spatialScope}` : ''
  ].filter(Boolean).join(' | ')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box lg" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">
            <i className="fa-solid fa-circle-info text-primary me-2"></i>因子详情
          </h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="p-3" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Basic info */}
          <div className="detail-box mb-3">
            <div className="small muted">因子名称</div>
            <div className="fw-bold fs-5">{f.name || '-'}</div>
            <div className="detail-kv mt-2">
              <span className="pill"><i className="fa-solid fa-fingerprint"></i><span className="mono">{f.id || '-'}</span></span>
              <span className="pill"><i className="fa-solid fa-tag"></i>{typeLabel(f.type)}</span>
              {version && <span className="pill"><i className="fa-solid fa-hashtag"></i>{version}</span>}
              <span className="pill"><i className="fa-solid fa-ruler-combined"></i>{valueUnit}</span>
            </div>
            <div className="small muted mt-2">{descLine || '-'}</div>
          </div>

          {/* Boundary */}
          <div className="detail-box mb-3">
            <div className="detail-section-title">边界与口径说明</div>
            <div className="muted">{boundary || '-'}</div>
          </div>

          {/* Time / Space */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="detail-box h-100">
                <div className="detail-section-title">时间代表性</div>
                <div className="muted">{year || '-'}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="detail-box h-100">
                <div className="detail-section-title">空间适用范围</div>
                <div className="muted">{spatial || '-'}</div>
              </div>
            </div>
          </div>

          {/* Application */}
          <div className="detail-box mb-3">
            <div className="detail-section-title">工艺 / 产品描述 / 典型应用</div>
            <ul className="mb-0">
              {appList.length === 0 && <li className="muted">-</li>}
              {appList.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>

          {/* Caution */}
          <div className="detail-box mb-3">
            <div className="detail-section-title">不建议使用/注意事项</div>
            <ul className="mb-0">
              {cautionList.length === 0 && <li className="muted">-</li>}
              {cautionList.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            {usageNotes && <div className="small muted mt-2">{usageNotes}</div>}
          </div>

          {/* Source */}
          <div className="detail-box">
            <div className="detail-section-title">来源 / 版本信息</div>
            <div className="muted">{`${f.source || '-'}${version ? (' / ' + version) : ''}`}</div>
          </div>
        </div>

        <div className="p-3 border-top d-flex justify-content-between align-items-center">
          {user?.role === 'admin' && onDelete ? (
            <button className="btn btn-outline-danger btn-sm" onClick={() => onDelete(f)}>
              <i className="fa-solid fa-trash me-1"></i> 删除此因子
            </button>
          ) : <span />}
          <button className="btn btn-outline-secondary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}
