export default function Sidebar({ collapsed, onToggle, currentView, onSwitch, user, onLogout }) {
  const views = [
    { key: 'database', label: '数据库', icon: 'fa-database' },
    { key: 'library', label: '因子库', icon: 'fa-book' },
    { key: 'packages', label: '因子包', icon: 'fa-boxes-stacked' },
  ]

  // Admin-only views
  if (user?.role === 'admin') {
    views.push({ key: 'reviews', label: '审核', icon: 'fa-clipboard-check' })
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {!collapsed && (
        <button className="collapse-btn" onClick={onToggle} title="收起边栏">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
      )}

      {/* Collapsed: icon mode */}
      {collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="sidebar-icon" onClick={onToggle} title="打开边栏">
            <i className="fa-solid fa-layer-group"></i>
          </div>
          {views.map(v => (
            <div
              key={v.key}
              className={`sidebar-icon${currentView === v.key ? ' active' : ''}`}
              onClick={() => onSwitch(v.key)}
              title={v.label}
            >
              <i className={`fa-solid ${v.icon}`}></i>
            </div>
          ))}
          <div style={{ marginTop: 'auto', padding: '12px 0', textAlign: 'center' }}>
            <div className="sidebar-icon" onClick={onLogout} title="退出登录">
              <i className="fa-solid fa-right-from-bracket"></i>
            </div>
          </div>
        </div>
      )}

      {/* Expanded: text mode */}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 42px)' }}>
          <div className="nav-category">主功能入口</div>
          {views.map(v => (
            <div
              key={v.key}
              className={`sidebar-expanded-item${currentView === v.key ? ' active' : ''}`}
              onClick={() => onSwitch(v.key)}
            >
              <i className={`fa-solid ${v.icon}`}></i> {v.label}
            </div>
          ))}

          <div className="sb-user">
            <div className="sb-user-name">{user.displayName}</div>
            <div className="sb-user-group">
              {user.groupName || '未设置课题组'}
              {user.role === 'admin' && <span className="sb-badge-admin">管理员</span>}
            </div>
            <button className="sb-logout" onClick={onLogout}>
              退出登录
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
