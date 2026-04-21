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
    <div className="lib-page">
      {/* Search + Create */}
      <div className="lib-toolbar">
        <div className="lib-search-wrap">
          <i className="fa-solid fa-magnifying-glass lib-search-icon"></i>
          <input
            type="text"
            className="lib-search"
            placeholder="搜索因子：名称 / 关键词 / 来源 / 单位 / 课题组..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="lib-btn-create" onClick={onCreateFactor}>
          <i className="fa-solid fa-plus"></i> 新增因子
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="lib-filters">
        <button
          className={`lib-tab${activeType === 'all' ? ' lib-tab-active' : ''}`}
          onClick={() => setActiveType('all')}
        >
          全部
        </button>
        {FACTOR_TYPES.map(t => (
          <button
            key={t.key}
            className={`lib-tab${activeType === t.key ? ' lib-tab-active' : ''}`}
            onClick={() => setActiveType(t.key)}
          >
            <i className={`fa-solid ${t.icon}`}></i>
            {t.label.replace('类因子', '')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="lib-table-wrap">
        <table className="lib-table">
          <thead>
            <tr>
              <th className="lib-th" style={{ width: '42%' }}>名称</th>
              <th className="lib-th" style={{ width: '15%' }}>来源</th>
              <th className="lib-th" style={{ width: '15%' }}>提交方</th>
              <th className="lib-th" style={{ width: '8%', textAlign: 'center' }}>引用</th>
              <th className="lib-th" style={{ width: '20%', textAlign: 'right' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id} className="lib-row">
                <td className="lib-td lib-td-name" onClick={() => onViewDetail(f)}>
                  {f.name}
                </td>
                <td className="lib-td lib-td-muted">{f.source || '-'}</td>
                <td className="lib-td">
                  {f.creator_group
                    ? <span className="lib-tag">{f.creator_group}</span>
                    : <span className="lib-td-muted">-</span>
                  }
                </td>
                <td className="lib-td" style={{ textAlign: 'center' }}>
                  {f.usage_count > 0
                    ? <span className="lib-count lib-count-active">{f.usage_count}</span>
                    : <span className="lib-count">{0}</span>
                  }
                </td>
                <td className="lib-td lib-td-actions">
                  <button className="lib-action" title="查看详情" onClick={() => onViewDetail(f)}>
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  <button className="lib-action" title="编辑" onClick={() => onEditFactor(f)}>
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button className="lib-action lib-action-primary" title="添加到因子包" onClick={() => onAddToPackage(f)}>
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="5" className="lib-td lib-empty">未找到匹配的因子</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="lib-footer">
        共 {filtered.length} 条因子 · 因子包 {packages.length} 个
      </div>
    </div>
  )
}
