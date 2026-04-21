import { typeLabel, FACTOR_TYPES } from '../App.jsx'

function parseBoundary(raw) {
  if (!raw) return { includes: [], excludes: [] }
  const includes = []
  const excludes = []
  const parts = raw.split(/[；;。]/).map(s => s.trim()).filter(Boolean)
  for (const p of parts) {
    if (p.startsWith('不包括') || p.startsWith('不含') || p.startsWith('不包含') || p.startsWith('未包括') || p.startsWith('不涵盖')) {
      const content = p.replace(/^(不包括|不含|不包含|未包括|不涵盖)/, '').trim()
      const items = content.split(/[、,，]/).map(s => s.trim()).filter(Boolean)
      excludes.push(...items)
    } else {
      const content = p.replace(/^(仅包括|包括|仅包含|包含|涵盖|仅涵盖)/, '').trim()
      if (content) includes.push(content)
    }
  }
  return { includes, excludes }
}

export default function FactorDetailModal({ factor, onClose, user, onDelete }) {
  const f = factor
  const version = f.version || ''
  const boundary = f.boundary_note || f.boundary || ''
  const year = f.year || ''
  const spatialScope = f.spatial_scope || ''
  const spatialNote = f.spatial_note || ''
  const appList = Array.isArray(f.application_examples) ? f.application_examples : []
  const cautionList = Array.isArray(f.caution_examples) ? f.caution_examples : []
  const usageNotes = f.usage_notes || ''
  const valueUnit = (f.value !== undefined && f.value !== null && f.unit)
    ? `${Number(f.value)} ${f.unit}` : '-'

  const typeInfo = FACTOR_TYPES.find(x => x.key === f.type)
  const typeIcon = typeInfo ? typeInfo.icon : 'fa-tag'

  const { includes: bdIncludes, excludes: bdExcludes } = parseBoundary(boundary)

  // 构建元信息
  const creatorText = f.creator_name
    ? (f.creator_group ? `${f.creator_name} / ${f.creator_group}` : f.creator_name)
    : '-'
  const dateText = f.created_at ? f.created_at.slice(0, 10) : '-'
  const usageText = (f.usage_count !== undefined && f.usage_count !== null) ? `${f.usage_count} 次` : '-'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="fd-header">
          <span className="fd-header-title">因子详情</span>
          <button className="fd-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>

        {/* Body */}
        <div className="fd-body">

          {/* ====== 身份区: 名称 + 数值 ====== */}
          <div className="fd-identity-top">
            <div className="fd-name">{f.name || '-'}</div>
            <div className="fd-value-badge">{valueUnit}</div>
          </div>

          {/* ====== 6宫格: 基础信息 ====== */}
          <div className="fd-info-grid">
            <div className="fd-info-cell">
              <div className="fd-info-label">因子 ID</div>
              <div className="fd-info-val mono">{f.id || '-'}</div>
            </div>
            <div className="fd-info-cell">
              <div className="fd-info-label">因子类型</div>
              <div className="fd-info-val"><i className={`fa-solid ${typeIcon} fd-info-icon`}></i>{typeLabel(f.type)}</div>
            </div>
            <div className="fd-info-cell">
              <div className="fd-info-label">版本</div>
              <div className="fd-info-val">{version || '-'}</div>
            </div>
            <div className="fd-info-cell">
              <div className="fd-info-label">数据来源</div>
              <div className="fd-info-val">{f.source || '-'}</div>
              {f.source_citation && <div style={{ fontSize: '0.75rem', color: '#a39e98', marginTop: 4, lineHeight: 1.4 }}>{f.source_citation}</div>}
            </div>
            <div className="fd-info-cell">
              <div className="fd-info-label">录入者</div>
              <div className="fd-info-val">{creatorText}</div>
            </div>
            <div className="fd-info-cell">
              <div className="fd-info-label">被引用</div>
              <div className="fd-info-val">{usageText}</div>
            </div>
          </div>

          {/* ====== 分割线 + 适用性评估 ====== */}
          <div className="fd-divider"></div>
          <div className="fd-section-label">适用性评估</div>

          <div className="fd-rep-grid">
            <div className="fd-rep-card">
              <div className="fd-rep-head">
                <i className="fa-regular fa-calendar"></i>
                <span>时间代表性</span>
              </div>
              <div className="fd-rep-val">{year || '-'}</div>
            </div>
            <div className="fd-rep-card">
              <div className="fd-rep-head">
                <i className="fa-solid fa-location-dot"></i>
                <span>空间代表性</span>
              </div>
              <div className="fd-rep-val">{spatialScope || '-'}</div>
              {spatialNote && <div className="fd-rep-sub">{spatialNote}</div>}
            </div>
            <div className="fd-rep-card fd-rep-card-wide">
              <div className="fd-rep-head">
                <i className="fa-solid fa-gears"></i>
                <span>工艺 / 技术代表性</span>
              </div>
              {(bdIncludes.length > 0 || bdExcludes.length > 0) ? (
                <div className="fd-boundary-list">
                  {bdIncludes.map((t, i) => (
                    <div key={'in' + i} className="fd-bd-item fd-bd-inc">
                      <i className="fa-solid fa-check"></i><span>{t}</span>
                    </div>
                  ))}
                  {bdExcludes.map((t, i) => (
                    <div key={'ex' + i} className="fd-bd-item fd-bd-exc">
                      <i className="fa-solid fa-xmark"></i><span>{t}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="fd-rep-val">{boundary || '-'}</div>
              )}
            </div>
          </div>

          {/* ====== 分割线 + 典型应用场景 ====== */}
          {appList.length > 0 && (
            <>
              <div className="fd-divider"></div>
              <div className="fd-card">
                <div className="fd-card-title">
                  <i className="fa-solid fa-check-circle" style={{ color: '#2a9d99' }}></i>
                  典型应用场景
                </div>
                <div className="fd-scene-list">
                  {appList.map((t, i) => <div key={i} className="fd-scene-item">{t}</div>)}
                </div>
              </div>
            </>
          )}

          {/* ====== 注意事项 ====== */}
          {(cautionList.length > 0 || usageNotes) && (
            <div className="fd-card fd-card-warn">
              <div className="fd-card-title">
                <i className="fa-solid fa-triangle-exclamation" style={{ color: '#dd5b00' }}></i>
                不适用场景 / 注意事项
              </div>
              {cautionList.length > 0 && (
                <div className="fd-scene-list">
                  {cautionList.map((t, i) => <div key={i} className="fd-scene-item">{t}</div>)}
                </div>
              )}
              {usageNotes && <div className="fd-usage-note">{usageNotes}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fd-footer">
          {user?.role === 'admin' && onDelete ? (
            <button className="btn btn-outline-danger btn-sm" onClick={() => onDelete(f)}>
              <i className="fa-solid fa-trash me-1"></i> 删除此因子
            </button>
          ) : <span />}
          <button className="fd-btn-close" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}
