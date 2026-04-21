import { useState } from 'react'

export default function DatabaseView({ factors, onViewDetail, onAddToPackage, sidebarCollapsed }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)

  const handleSearch = () => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setResults(null)
      return
    }
    const filtered = factors.filter(f => {
      const hay = `${f.id} ${f.name} ${f.unit} ${f.source} ${f.type}`.toLowerCase()
      return hay.includes(q)
    })
    setResults(filtered)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div className="database-logo" style={sidebarCollapsed ? {} : { left: 'calc(var(--sidebar-w) + 20px)' }}>
        CBase
      </div>

      <div style={{ flex: '0 0 auto', height: '37.5vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', width: '75%', margin: '0 auto' }}>
          <div className="database-prompt">你想查什么？</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 40 }}>
        <div style={{ width: '75%', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              className="database-search-input"
              style={{ flex: 1 }}
              placeholder="搜索因子：名称 / 关键词 / 来源 / 单位..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="database-search-btn" type="button" onClick={handleSearch}>
              <i className="fa-solid fa-magnifying-glass" style={{ marginRight: 8 }}></i>搜索
            </button>
          </div>

          {results !== null && (
            <div className="lib-table-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
              <table className="lib-table">
                <thead>
                  <tr>
                    <th className="lib-th" style={{ width: '70%' }}>名称</th>
                    <th className="lib-th" style={{ width: '20%' }}>来源</th>
                    <th className="lib-th" style={{ width: '10%', textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(f => (
                    <tr key={f.id} className="lib-row">
                      <td className="lib-td lib-td-name" onClick={() => onViewDetail(f)}>{f.name}</td>
                      <td className="lib-td lib-td-muted">{f.source || '-'}</td>
                      <td className="lib-td lib-td-actions">
                        <button className="lib-action" title="查看详情" onClick={() => onViewDetail(f)}>
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button className="lib-action lib-action-primary" title="添加到因子包" onClick={() => onAddToPackage(f)}>
                          <i className="fa-solid fa-plus"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {results.length === 0 && (
                    <tr><td colSpan="3" className="lib-td lib-empty">未找到匹配的因子</td></tr>
                  )}
                </tbody>
              </table>
              {results.length > 0 && (
                <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '0.78rem', color: '#c4c2bb' }}>
                  共找到 {results.length} 条结果
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
