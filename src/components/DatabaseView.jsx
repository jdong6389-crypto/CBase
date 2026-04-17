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
              className="database-search-input form-control"
              style={{ flex: 1 }}
              placeholder="搜索因子：名称 / 关键词 / 来源 / 单位..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="database-search-btn" type="button" onClick={handleSearch}>
              <i className="fa-solid fa-magnifying-glass me-2"></i>搜索
            </button>
          </div>

          {results !== null && (
            <div className="cardx" style={{ width: '100%' }}>
              <div className="table-responsive" style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '70%' }}>名称</th>
                      <th style={{ width: '20%' }}>来源</th>
                      <th style={{ width: '10%' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(f => (
                      <tr key={f.id}>
                        <td className="fw-bold">{f.name}</td>
                        <td className="muted">{f.source || '-'}</td>
                        <td>
                          <div className="btn-group">
                            <button className="btn btn-sm btn-outline-primary" title="查看详情" onClick={() => onViewDetail(f)}>
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            <button className="btn btn-sm btn-primary" title="添加到因子包" onClick={() => onAddToPackage(f)}>
                              <i className="fa-solid fa-square-plus"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {results.length === 0 && (
                      <tr><td colSpan="3" className="text-center muted py-4">未找到匹配的因子</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-center mt-3 small muted pb-3">
                共找到 {results.length} 条结果
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
