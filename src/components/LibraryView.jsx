import { useState, useMemo } from 'react'
import { FACTOR_TYPES, typeLabel } from '../App.jsx'

export default function LibraryView({ factors, packages, onViewDetail, onAddToPackage, onCreateFactor, onEditFactor, onDeleteFactor, user }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeType, setActiveType] = useState('all')

  const filtered = useMemo(() => {
    let rows = factors.slice()
    if (activeType !== 'all') {
      rows = rows.filter(f => f.type === activeType)
    }
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      rows = rows.filter(f => {
        const hay = `${f.id} ${f.name} ${f.unit} ${f.source} ${typeLabel(f.type)} ${f.creator_group || ''}`.toLowerCase()
        return hay.includes(q)
      })
    }
    return rows
  }, [factors, activeType, searchQuery])

  return (
    <div>
      <div className="cardx mb-3" style={{ padding: 12 }}>
        <div className="row g-2 align-items-center">
          <div className="col">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="fa-solid fa-magnifying-glass text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="搜索因子：名称 / 关键词 / 来源 / 单位 / 课题组..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-auto">
            <button className="btn btn-success" onClick={onCreateFactor}>
              <i className="fa-solid fa-plus me-1"></i> 新增因子
            </button>
          </div>
        </div>

        <div className="mt-3">
          <button
            className={`btn btn-outline-primary btn-sm me-2${activeType === 'all' ? ' active' : ''}`}
            onClick={() => setActiveType('all')}
          >
            全部因子
          </button>
          {FACTOR_TYPES.map(t => (
            <button
              key={t.key}
              className={`btn btn-outline-secondary btn-sm me-2${activeType === t.key ? ' active' : ''}`}
              onClick={() => setActiveType(t.key)}
            >
              <i className={`fa-solid ${t.icon} me-1`}></i>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cardx">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>名称</th>
                <th style={{ width: '18%' }}>来源</th>
                <th style={{ width: '18%' }}>提交方</th>
                <th style={{ width: '10%' }}>引用</th>
                <th style={{ width: '14%' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td className="fw-bold">{f.name}</td>
                  <td className="muted">{f.source || '-'}</td>
                  <td>
                    {f.creator_group ? (
                      <span className="badge bg-light text-dark border">{f.creator_group}</span>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${f.usage_count > 0 ? 'bg-primary' : 'bg-light text-muted border'}`}>
                      {f.usage_count || 0}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-primary" title="查看详情" onClick={() => onViewDetail(f)}>
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" title="编辑" onClick={() => onEditFactor(f)}>
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn btn-sm btn-primary" title="添加到因子包" onClick={() => onAddToPackage(f)}>
                        <i className="fa-solid fa-square-plus"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="5" className="text-center muted py-4">未找到匹配的因子</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center mt-3 small muted">
        共显示 {filtered.length} 条因子 | 因子包总数 {packages.length}
      </div>
    </div>
  )
}
