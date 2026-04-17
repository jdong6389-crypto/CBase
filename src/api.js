const BASE = '/api'

function getToken() {
  return localStorage.getItem('cbase_token') || ''
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Factors
  getFactors: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/factors${qs ? '?' + qs : ''}`)
  },
  getFactor: (id) => request(`/factors/${id}`),
  createFactor: (body) => request('/factors', { method: 'POST', body: JSON.stringify(body) }),
  updateFactor: (id, body) => request(`/factors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFactor: (id) => request(`/factors/${id}`, { method: 'DELETE' }),

  // Packages
  getPackages: () => request('/packages'),
  createPackage: (body) => request('/packages', { method: 'POST', body: JSON.stringify(body) }),
  renamePackage: (id, name) => request(`/packages/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deletePackage: (id) => request(`/packages/${id}`, { method: 'DELETE' }),

  // Usages
  getUsages: (pkgId) => request(`/packages/${pkgId}/usages`),
  createUsage: (pkgId, body) => request(`/packages/${pkgId}/usages`, { method: 'POST', body: JSON.stringify(body) }),
  updateUsage: (pkgId, usageId, body) => request(`/packages/${pkgId}/usages/${usageId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUsage: (pkgId, usageId) => request(`/packages/${pkgId}/usages/${usageId}`, { method: 'DELETE' }),

  // Reviews (admin)
  getReviews: (status = 'pending') => request(`/reviews?status=${status}`),
  getReview: (id) => request(`/reviews/${id}`),
  approveReview: (id) => request(`/reviews/${id}/approve`, { method: 'POST' }),
  rejectReview: (id, reason) => request(`/reviews/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
}

export default api
