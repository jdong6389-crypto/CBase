import { useState, useEffect } from 'react'
import api from '../api.js'
import { typeLabel } from '../App.jsx'

export default function ReviewPanel({ onRefreshFactors }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadReviews = () => {
    setLoading(true)
    api.getReviews('pending').then(setReviews).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { loadReviews() }, [])

  const handleApprove = async (id) => {
    if (!confirm('确认通过此修改？因子数据将被更新。')) return
    try {
      await api.approveReview(id)
      loadReviews()
      onRefreshFactors()
    } catch (err) { alert(err.message) }
  }

  const handleReject = async () => {
    if (!rejectId) return
    try {
      await api.rejectReview(rejectId, rejectReason)
      setRejectId(null)
      setRejectReason('')
      loadReviews()
    } catch (err) { alert(err.message) }
  }

  const viewDetail = async (id) => {
    try {
      const data = await api.getReview(id)
      setDetail(data)
    } catch (err) { alert(err.message) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'rgba(0,0,0,0.88)' }}>
            <i className="fa-solid fa-clipboard-check" style={{ marginRight: 8, color: '#a39e98' }}></i>
            待审核修改
          </span>
          {reviews.length > 0 && (
            <span className="rv-badge">{reviews.length}</span>
          )}
        </div>
        <button className="pk-btn" onClick={loadReviews}>
          <i className="fa-solid fa-arrows-rotate"></i> 刷新
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#c4c2bb' }}>加载中...</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#a39e98', background: '#fff', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 12 }}>
          <i className="fa-solid fa-check-circle" style={{ fontSize: '2rem', color: '#2a9d99', marginBottom: 12, display: 'block' }}></i>
          暂无待审核的修改
        </div>
      ) : (
        <div className="lib-table-wrap">
          <table className="lib-table">
            <thead>
              <tr>
                <th className="lib-th" style={{ width: '25%' }}>因子</th>
                <th className="lib-th" style={{ width: '15%' }}>提交修改为</th>
                <th className="lib-th" style={{ width: '15%' }}>提交人</th>
                <th className="lib-th" style={{ width: '15%' }}>课题组</th>
                <th className="lib-th" style={{ width: '12%' }}>时间</th>
                <th className="lib-th" style={{ width: '18%', textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id} className="lib-row">
                  <td className="lib-td">
                    <div className="pk-factor-name">{r.original_name || r.factor_id}</div>
                    <div className="pk-factor-meta">{r.factor_id}</div>
                  </td>
                  <td className="lib-td" style={{ fontSize: '0.85rem' }}>{r.name}</td>
                  <td className="lib-td">{r.submitter_name || '-'}</td>
                  <td className="lib-td">
                    {r.submitter_group
                      ? <span className="lib-tag">{r.submitter_group}</span>
                      : <span className="lib-td-muted">-</span>
                    }
                  </td>
                  <td className="lib-td lib-td-muted" style={{ fontSize: '0.8rem' }}>{r.created_at?.slice(5, 16)}</td>
                  <td className="lib-td lib-td-actions">
                    <button className="lib-action" title="查看对比" onClick={() => viewDetail(r.id)}>
                      <i className="fa-solid fa-eye"></i>
                    </button>
                    <button className="lib-action rv-action-approve" title="通过" onClick={() => handleApprove(r.id)}>
                      <i className="fa-solid fa-check"></i>
                    </button>
                    <button className="lib-action rv-action-reject" title="驳回" onClick={() => { setRejectId(r.id); setRejectReason('') }}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="modal-overlay" onClick={() => setRejectId(null)}>
          <div className="modal-box" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="fd-header">
              <span className="fd-header-title">
                <i className="fa-solid fa-xmark" style={{ marginRight: 6, color: '#b53333' }}></i>
                驳回修改
              </span>
              <button className="fd-close" onClick={() => setRejectId(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="fd-body">
              <label className="fd-form-label">驳回原因（可选）</label>
              <textarea className="fd-input" rows="3" style={{ width: '100%' }} value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="告知提交者为什么驳回..." />
            </div>
            <div className="fd-footer">
              <span></span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="fd-btn-close" onClick={() => setRejectId(null)}>取消</button>
                <button className="fd-btn-save rv-btn-reject" onClick={handleReject}>确认驳回</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail comparison modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box lg" onClick={e => e.stopPropagation()}>
            <div className="fd-header">
              <span className="fd-header-title">
                <i className="fa-solid fa-code-compare" style={{ marginRight: 6 }}></i>
                修改对比
              </span>
              <button className="fd-close" onClick={() => setDetail(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="fd-body">
              <div className="lib-table-wrap" style={{ marginBottom: 14 }}>
                <table className="lib-table">
                  <thead>
                    <tr>
                      <th className="lib-th" style={{ width: '20%' }}>字段</th>
                      <th className="lib-th" style={{ width: '40%' }}>原值</th>
                      <th className="lib-th" style={{ width: '40%' }}>修改为</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['name', 'type', 'value', 'unit', 'source', 'version', 'year',
                      'spatial_scope', 'spatial_note', 'boundary_note', 'usage_notes'].map(field => {
                      const orig = detail.original?.[field] ?? '-'
                      const edit = detail.edit?.[field] ?? '-'
                      const changed = String(orig) !== String(edit)
                      return (
                        <tr key={field} className={`lib-row${changed ? ' rv-row-changed' : ''}`}>
                          <td className="lib-td" style={{ fontWeight: 600, fontSize: '0.82rem' }}>{field}</td>
                          <td className="lib-td" style={{ fontSize: '0.85rem' }}>{String(orig)}</td>
                          <td className="lib-td" style={{ fontSize: '0.85rem' }}>
                            {changed ? <strong style={{ color: '#1e293b' }}>{String(edit)}</strong> : String(edit)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a39e98' }}>
                提交人：{detail.edit?.submitter_name} ({detail.edit?.submitter_group || '未设置课题组'})
                | 提交时间：{detail.edit?.created_at}
              </div>
            </div>
            <div className="fd-footer">
              <button className="fd-btn-close" onClick={() => setDetail(null)}>关闭</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="fd-btn-save" onClick={() => { handleApprove(detail.edit.id); setDetail(null) }}>
                  <i className="fa-solid fa-check" style={{ marginRight: 6 }}></i>通过
                </button>
                <button className="fd-btn-close rv-btn-reject-outline" onClick={() => { setDetail(null); setRejectId(detail.edit.id); setRejectReason('') }}>
                  <i className="fa-solid fa-xmark" style={{ marginRight: 6 }}></i>驳回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
