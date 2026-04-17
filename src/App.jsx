import { useState, useEffect, useCallback } from 'react'
import api from './api.js'
import Sidebar from './components/Sidebar.jsx'
import LoginPage from './components/LoginPage.jsx'
import DatabaseView from './components/DatabaseView.jsx'
import LibraryView from './components/LibraryView.jsx'
import PackagesView from './components/PackagesView.jsx'
import FactorDetailModal from './components/FactorDetailModal.jsx'
import AddToPackageModal from './components/AddToPackageModal.jsx'
import CreatePackageModal from './components/CreatePackageModal.jsx'
import EditUsageModal from './components/EditUsageModal.jsx'
import FactorFormModal from './components/FactorFormModal.jsx'
import ReviewPanel from './components/ReviewPanel.jsx'

const FACTOR_TYPES = [
  { key: 'energy', label: '能源燃料类因子', icon: 'fa-bolt' },
  { key: 'material', label: '物质材料类因子', icon: 'fa-cubes' },
  { key: 'transport', label: '运输过程类因子', icon: 'fa-truck' },
  { key: 'equipment', label: '机械设备类因子', icon: 'fa-tractor' },
  { key: 'process', label: '工艺过程排放类因子', icon: 'fa-flask' },
  { key: 'waste', label: '废弃与回收类因子', icon: 'fa-recycle' },
]

export { FACTOR_TYPES }

export function typeLabel(typeKey) {
  const t = FACTOR_TYPES.find(x => x.key === typeKey)
  return t ? t.label : (typeKey || '-')
}

export function stageLabel(stage) {
  return ({ raw: '原料与材料阶段', construction: '施工阶段', operation: '运营与维护阶段', end: '报废与回收阶段' })[stage] || (stage || '-')
}

export function objLabel(obj) {
  return ({ road: '公路工程', waterway: '水路工程', general: '通用' })[obj] || (obj || '-')
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [factors, setFactors] = useState([])
  const [packages, setPackages] = useState([])
  const [currentView, setCurrentView] = useState('database')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  // Modal states
  const [detailFactor, setDetailFactor] = useState(null)
  const [addToPackageFactor, setAddToPackageFactor] = useState(null)
  const [showCreatePackage, setShowCreatePackage] = useState(false)
  const [editUsage, setEditUsage] = useState(null)
  const [activePackageId, setActivePackageId] = useState(null)
  const [factorFormTarget, setFactorFormTarget] = useState(null) // null=closed, false=create, factor=edit

  // Check existing session
  useEffect(() => {
    const token = localStorage.getItem('cbase_token')
    if (token) {
      api.me().then(data => setUser(data.user)).catch(() => {
        localStorage.removeItem('cbase_token')
      }).finally(() => setAuthChecked(true))
    } else {
      setAuthChecked(true)
    }
  }, [])

  // Load data once logged in
  const loadFactors = useCallback(() => {
    api.getFactors().then(setFactors).catch(console.error)
  }, [])

  const loadPackages = useCallback(() => {
    api.getPackages().then(setPackages).catch(console.error)
  }, [])

  useEffect(() => {
    if (user) {
      loadFactors()
      loadPackages()
    }
  }, [user, loadFactors, loadPackages])

  const handleLogin = (token, userData) => {
    localStorage.setItem('cbase_token', token)
    setUser(userData)
  }

  const handleLogout = () => {
    api.logout().catch(() => {})
    localStorage.removeItem('cbase_token')
    setUser(null)
    setFactors([])
    setPackages([])
  }

  const handleSaveFactor = async (formData) => {
    if (factorFormTarget) {
      // Edit existing
      await api.updateFactor(factorFormTarget.id, formData)
      setFactorFormTarget(null)
      loadFactors()
    } else {
      // Create new
      await api.createFactor(formData)
      setFactorFormTarget(null)
      loadFactors()
    }
  }

  const handleDeleteFactor = async (factor) => {
    if (!confirm(`确认删除因子：${factor.name}？\n删除后不可恢复，该因子在所有因子包中的引用也将被移除。`)) return
    try {
      await api.deleteFactor(factor.id)
      loadFactors()
      loadPackages()
    } catch (err) {
      alert(err.message)
    }
  }

  if (!authChecked) return null

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="layout-wrapper">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
        currentView={currentView}
        onSwitch={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main">
        {currentView === 'database' && (
          <DatabaseView
            factors={factors}
            onViewDetail={setDetailFactor}
            onAddToPackage={setAddToPackageFactor}
            sidebarCollapsed={sidebarCollapsed}
          />
        )}
        {currentView === 'library' && (
          <LibraryView
            factors={factors}
            packages={packages}
            user={user}
            onViewDetail={setDetailFactor}
            onAddToPackage={setAddToPackageFactor}
            onCreateFactor={() => setFactorFormTarget(false)}
            onEditFactor={(f) => setFactorFormTarget(f)}
            onDeleteFactor={handleDeleteFactor}
            onRefresh={loadFactors}
          />
        )}
        {currentView === 'packages' && (
          <PackagesView
            packages={packages}
            factors={factors}
            activePackageId={activePackageId}
            onSelectPackage={setActivePackageId}
            onCreatePackage={() => setShowCreatePackage(true)}
            onRefreshPackages={loadPackages}
            onViewDetail={setDetailFactor}
            onAddToPackage={setAddToPackageFactor}
            onEditUsage={setEditUsage}
          />
        )}
        {currentView === 'reviews' && user.role === 'admin' && (
          <ReviewPanel onRefreshFactors={loadFactors} />
        )}
      </main>

      {detailFactor && (
        <FactorDetailModal
          factor={detailFactor}
          user={user}
          onClose={() => setDetailFactor(null)}
          onDelete={(f) => {
            setDetailFactor(null)
            handleDeleteFactor(f)
          }}
        />
      )}
      {addToPackageFactor && (
        <AddToPackageModal
          factor={addToPackageFactor}
          factors={factors}
          packages={packages}
          preferPackageId={activePackageId}
          onClose={() => setAddToPackageFactor(null)}
          onCreated={(pkgId) => {
            setAddToPackageFactor(null)
            setActivePackageId(pkgId)
            loadPackages()
          }}
        />
      )}
      {showCreatePackage && (
        <CreatePackageModal
          onClose={() => setShowCreatePackage(false)}
          onCreated={(pkg) => {
            setShowCreatePackage(false)
            setActivePackageId(pkg.id)
            loadPackages()
          }}
        />
      )}
      {editUsage && (
        <EditUsageModal
          usage={editUsage}
          onClose={() => setEditUsage(null)}
          onSaved={() => {
            setEditUsage(null)
            loadPackages()
          }}
        />
      )}
      {factorFormTarget !== null && (
        <FactorFormModal
          factor={factorFormTarget || null}
          onClose={() => setFactorFormTarget(null)}
          onSave={handleSaveFactor}
        />
      )}
    </div>
  )
}
