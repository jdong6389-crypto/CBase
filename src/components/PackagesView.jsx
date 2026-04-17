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
    <div className="pkg-wrap">
      {/* Left: package list */}
      <div className="pkg-left">
        <div className="cardx p-3 mb-2">
          <div className="d-flex justify-content-between align-items-center">
            <div className="fw-bold"><i className="fa-solid fa-box-open me-2 text-primary"></i>因子包列表</div>
            <button className="btn btn-sm btn-success" type="button" onClick={onCreatePackage}>
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          <div className="mt-2 small muted">因子包用于"把因子放进你的工程过程里"，用于后续计算与追溯。</div>
        </div>

        <div className="cardx p-2">
          <div className="list-group">
            {packages.length === 0 && (
              <div className="p-3 small muted">暂无因子包。点击上方"+"新建。</div>
            )}
            {packages.map(pkg => (
              <div
                key={pkg.id}
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center${pkg.id === activePackageId ? ' active' : ''}`}
                onClick={() => onSelectPackage(pkg.id)}
              >
                <div>
                  <div className="fw-bold">{pkg.name}</div>
                  <div className="small muted">使用项 {pkg.usage_count ?? 0} 条</div>
                </div>
                <span className="badge bg-light text-dark mono">{pkg.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: active package detail */}
      <div className="pkg-right">
        <div className="cardx p-3 mb-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-bold">
                <i className="fa-solid fa-circle-info me-2 text-primary"></i>
                {activePkg ? activePkg.name : '请选择一个因子包'}
              </div>
              <div className="small muted">
                {activePkg ? `包ID：${activePkg.id} | 创建时间：${activePkg.created_at || '-'}` : '-'}
              </div>
            </div>
            {activePkg && (
              <div className="d-flex gap-2">
                <button className="btn btn-primary btn-sm" onClick={() => onAddToPackage({ _selectFromAll: true })}>
                  <i className="fa-solid fa-plus me-1"></i> 添加因子
                </button>
                <button className="btn btn-outline-secondary btn-sm" onClick={handleRename}>
                  <i className="fa-solid fa-pen me-1"></i> 重命名
                </button>
                <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}>
                  <i className="fa-solid fa-trash me-1"></i> 删除包
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="cardx">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>使用项ID</th>
                  <th style={{ width: '22%' }}>因子</th>
                  <th style={{ width: '12%' }}>对象</th>
                  <th style={{ width: '14%' }}>阶段</th>
                  <th style={{ width: '22%' }}>过程/工序</th>
                  <th style={{ width: '10%' }}>备注</th>
                  <th style={{ width: '10%' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {!activePkg && (
                  <tr><td colSpan="7" className="text-center muted py-4">未选择因子包</td></tr>
                )}
                {activePkg && usages.length === 0 && (
                  <tr><td colSpan="7" className="text-center muted py-4">该因子包暂无使用项。请到因子库点击"+"添加。</td></tr>
                )}
                {usages.map(u => (
                  <tr key={u.id}>
                    <td className="mono text-muted">{u.id}</td>
                    <td>
                      <div className="fw-bold">{u.factor_name || u.factor_id}</div>
                      <div className="small muted">{typeLabel(u.factor_type || '')} | {u.factor_unit || ''}</div>
                    </td>
                    <td>{objLabel(u.obj)}</td>
                    <td>{stageLabel(u.stage)}</td>
                    <td>{u.process || '-'}</td>
                    <td className="muted">{u.note || ''}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-sm btn-outline-primary" title="查看详情"
                          onClick={() => {
                            const f = factors.find(x => x.id === u.factor_id)
                            if (f) onViewDetail(f)
                          }}>
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-primary" title="编辑"
                          onClick={() => onEditUsage({ ...u, packageId: activePackageId })}>
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" title="删除"
                          onClick={() => handleDeleteUsage(u.id)}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="small muted">当前包使用项：{usages.length} 条</div>
          {activePkg && usages.length > 0 && (
            <button className="btn btn-outline-primary btn-sm" onClick={handleExportCSV}>
              <i className="fa-solid fa-file-csv me-1"></i> 导出 CSV
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
