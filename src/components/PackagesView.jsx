import { useState, useEffect, useCallback } from 'react'
import api from '../api.js'
import { typeLabel, stageLabel, objLabel } from '../App.jsx'

export default function PackagesView({
  packages, factors, activePackageId, onSelectPackage,
  onCreatePackage, onRefreshPackages, onViewDetail, onAddToPackage, onEditUsage
}) {
  const [usages, setUsages] = useState([])

  const loadUsages = useCallback(() => {
    if (!activePackageId) { setUsages([]); return }
    api.getUsages(activePackageId).then(setUsages).catch(console.error)
  }, [activePackageId, packages])

  useEffect(() => { loadUsages() }, [loadUsages])

  const activePkg = packages.find(p => p.id === activePackageId)

  const handleRename = async () => {
    if (!activePkg) return
    const name = prompt('请输入新的因子包名称：', activePkg.name)
    if (!name?.trim()) return
    await api.renamePackage(activePkg.id, name.trim())
    onRefreshPackages()
  }

  const handleDelete = async () => {
    if (!activePkg) return
    if (!confirm(`确认删除因子包：${activePkg.name}？（将同时删除该包内所有使用项）`)) return
    await api.deletePackage(activePkg.id)
    onSelectPackage(null)
    onRefreshPackages()
  }

  const handleDeleteUsage = async (usageId) => {
    if (!confirm('确认删除该使用项？（不会影响因子本体）')) return
    await api.deleteUsage(activePackageId, usageId)
    loadUsages()
    onRefreshPackages()
  }

  const handleExportCSV = () => {
    if (!activePkg || usages.length === 0) return
    const header = ['因子名称', '因子类型', '数值', '单位', '工程对象', '生命周期阶段', '过程/工序', '备注'].join(',')
    const lines = usages.map(u => {
      return [
        (u.factor_name || '').replace(/,/g, ' '),
        typeLabel(u.factor_type || '').replace(/,/g, ' '),
        u.factor_value ?? '',
        (u.factor_unit || '').replace(/,/g, ' '),
        objLabel(u.obj).replace(/,/g, ' '),
        stageLabel(u.stage).replace(/,/g, ' '),
        (u.process || '').replace(/,/g, ' '),
        (u.note || '').replace(/,/g, ' ')
      ].join(',')
    })
    const csv = [header, ...lines].join('\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activePkg.name || activePkg.id}_factor_package.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="pk-wrap">
      {/* Left: package list */}
      <div className="pk-left">
        <div className="pk-panel pk-panel-head">
          <div className="pk-panel-title">
            <i className="fa-solid fa-box-open"></i>
            <span>因子包列表</span>
          </div>
          <button className="pk-btn-add" onClick={onCreatePackage} title="新建因子包">
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
        <div className="pk-hint">把因子放进工程过程里，用于后续计算与追溯。</div>

        <div className="pk-list">
          {packages.length === 0 && (
            <div className="pk-list-empty">暂无因子包，点击上方 + 新建。</div>
          )}
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className={`pk-item${pkg.id === activePackageId ? ' pk-item-active' : ''}`}
              onClick={() => onSelectPackage(pkg.id)}
            >
              <div>
                <div className="pk-item-name">{pkg.name}</div>
                <div className="pk-item-sub">使用项 {pkg.usage_count ?? 0} 条</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: active package detail */}
      <div className="pk-right">
        {/* Package header */}
        <div className="pk-detail-head">
          <div className="pk-detail-info">
            <div className="pk-detail-name">
              {activePkg ? activePkg.name : '请选择一个因子包'}
            </div>
            {activePkg && (
              <div className="pk-detail-meta">
                {activePkg.id} · {activePkg.created_at ? activePkg.created_at.slice(0, 10) : '-'}
              </div>
            )}
          </div>
          {activePkg && (
            <div className="pk-detail-actions">
              <button className="pk-btn pk-btn-primary" onClick={() => onAddToPackage({ _selectFromAll: true })}>
                <i className="fa-solid fa-plus"></i> 添加因子
              </button>
              <button className="pk-btn" onClick={handleRename}>
                <i className="fa-solid fa-pen"></i> 重命名
              </button>
              <button className="pk-btn pk-btn-danger" onClick={handleDelete}>
                <i className="fa-solid fa-trash-can"></i> 删除
              </button>
            </div>
          )}
        </div>

        {/* Usages table */}
        <div className="lib-table-wrap">
          <table className="lib-table">
            <thead>
              <tr>
                <th className="lib-th" style={{ width: '28%' }}>因子</th>
                <th className="lib-th" style={{ width: '14%' }}>对象</th>
                <th className="lib-th" style={{ width: '14%' }}>阶段</th>
                <th className="lib-th" style={{ width: '20%' }}>过程 / 工序</th>
                <th className="lib-th" style={{ width: '10%' }}>备注</th>
                <th className="lib-th" style={{ width: '14%', textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {!activePkg && (
                <tr><td colSpan="6" className="lib-td lib-empty">未选择因子包</td></tr>
              )}
              {activePkg && usages.length === 0 && (
                <tr><td colSpan="6" className="lib-td lib-empty">暂无使用项，请添加因子。</td></tr>
              )}
              {usages.map(u => (
                <tr key={u.id} className="lib-row">
                  <td className="lib-td">
                    <div className="pk-factor-name">{u.factor_name || u.factor_id}</div>
                    <div className="pk-factor-meta">{typeLabel(u.factor_type || '')} · {u.factor_unit || '-'}</div>
                  </td>
                  <td className="lib-td">{objLabel(u.obj)}</td>
                  <td className="lib-td">{stageLabel(u.stage)}</td>
                  <td className="lib-td">{u.process || '-'}</td>
                  <td className="lib-td lib-td-muted">{u.note || '-'}</td>
                  <td className="lib-td lib-td-actions">
                    <button className="lib-action" title="查看详情"
                      onClick={() => {
                        const f = factors.find(x => x.id === u.factor_id)
                        if (f) onViewDetail(f)
                      }}>
                      <i className="fa-solid fa-eye"></i>
                    </button>
                    <button className="lib-action" title="编辑"
                      onClick={() => onEditUsage({ ...u, packageId: activePackageId })}>
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button className="lib-action pk-action-del" title="删除"
                      onClick={() => handleDeleteUsage(u.id)}>
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pk-footer">
          <span className="pk-footer-count">
            {activePkg ? `${usages.length} 条使用项` : ''}
          </span>
          {activePkg && usages.length > 0 && (
            <button className="pk-btn" onClick={handleExportCSV}>
              <i className="fa-solid fa-download"></i> 导出 CSV
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
