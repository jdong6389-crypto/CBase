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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">
          <i className="fa-solid fa-clipboard-check text-primary me-2"></i>
          待审核修改
          {reviews.length > 0 && <span className="badge bg-danger ms-2">{reviews.length}</span>}
        </h5>
        <button className="btn btn-outline-secondary btn-sm" onClick={loadReviews}>
          <i className="fa-solid fa-arrows-rotate me-1"></i>刷新
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5 muted">加载中...</div>
      ) : reviews.length === 0 ? (
        <div className="cardx p-5 text-center muted">
          <i className="fa-solid fa-check-circle fa-2x mb-3 text-success"></i>
          <div>暂无待审核的修改</div>
        </div>
      ) : (
        <div className="cardx">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>因子</th>
                  <th style={{ width: '15%' }}>提交修改为</th>
                  <th style={{ width: '15%' }}>提交人</th>
                  <th style={{ width: '15%' }}>课题组</th>
                  <th style={{ width: '12%' }}>时间</th>
                  <th style={{ width: '18%' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="fw-bold">{r.original_name || r.factor_id}</div>
                      <div className="small muted">{r.factor_id}</div>
                    </td>
                    <td className="small">{r.name}</td>
                    <td>{r.submitter_name || '-'}</td>
                    <td>
                      {r.submitter_group ? (
                        <span className="badge bg-light text-dark border">{r.submitter_group}</span>
                      ) : '-'}
                    </td>
                    <td className="small muted">{r.created_at?.slice(5, 16)}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-sm btn-outline-primary" title="查看对比" onClick={() => viewDetail(r.id)}>
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button className="btn btn-sm btn-success" title="通过" onClick={() => handleApprove(r.id)}>
                          <i className="fa-solid fa-check"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" title="驳回" onClick={() => { setRejectId(r.id); setRejectReason('') }}>
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="modal-overlay" onClick={() => setRejectId(null)}>
          <div className="modal-box" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="p-3 border-bottom">
              <h6 className="fw-bold mb-0"><i className="fa-solid fa-xmark text-danger me-2"></i>驳回修改</h6>
            </div>
            <div className="p-3">
              <label className="form-label small fw-bold">驳回原因（可选）</label>
              <textarea className="form-control" rows="3" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="告知提交者为什么驳回..." />
            </div>
            <div className="p-3 border-top d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setRejectId(null)}>取消</button>
              <button className="btn btn-danger btn-sm" onClick={handleReject}>确认驳回</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail comparison modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0"><i className="fa-solid fa-code-compare text-primary me-2"></i>修改对比</h6>
              <button className="btn-close" onClick={() => setDetail(null)}></button>
            </div>
            <div className="p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>字段</th>
                    <th style={{ width: '40%' }}>原值</th>
                    <th style={{ width: '40%' }}>修改为</th>
                  </tr>
                </thead>
                <tbody>
                  {['name', 'type', 'value', 'unit', 'source', 'version', 'year',
                    'spatial_scope', 'spatial_note', 'boundary_note', 'usage_notes'].map(field => {
                    const orig = detail.original?.[field] ?? '-'
                    const edit = detail.edit?.[field] ?? '-'
                    const changed = String(orig) !== String(edit)
                    return (
                      <tr key={field} className={changed ? 'table-warning' : ''}>
                        <td className="fw-bold small">{field}</td>
                        <td className="small">{String(orig)}</td>
                        <td className="small">{changed ? <strong>{String(edit)}</strong> : String(edit)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="small muted">
                提交人：{detail.edit?.submitter_name} ({detail.edit?.submitter_group || '未设置课题组'})
                | 提交时间：{detail.edit?.created_at}
              </div>
            </div>
            <div className="p-3 border-top d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setDetail(null)}>关闭</button>
              <button className="btn btn-success btn-sm" onClick={() => { handleApprove(detail.edit.id); setDetail(null) }}>
                <i className="fa-solid fa-check me-1"></i>通过
              </button>
              <button className="btn btn-outline-danger btn-sm" onClick={() => { setDetail(null); setRejectId(detail.edit.id); setRejectReason('') }}>
                <i className="fa-solid fa-xmark me-1"></i>驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
