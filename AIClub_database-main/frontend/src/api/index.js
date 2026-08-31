import client from './client'

// ---------- 活动 ----------
export const fetchActivities = () => client.get('/activities').then((r) => r.data)

export const fetchActivity = (id) => client.get(`/activities/${id}`).then((r) => r.data)

export const createActivity = (data) => client.post('/activities', data).then((r) => r.data)

export const updateActivity = (id, data) =>
  client.put(`/activities/${id}`, data).then((r) => r.data)

export const deleteActivity = (id) => client.delete(`/activities/${id}`).then((r) => r.data)

export const fetchActivityMaterials = (id) =>
  client.get(`/activities/${id}/materials`).then((r) => r.data)

// ---------- 上传 ----------
export const analyzeUpload = (file, activityName) => {
  const form = new FormData()
  form.append('file', file)
  form.append('activity_name', activityName || '')
  return client.post('/upload/analyze', form).then((r) => r.data)
}

export const confirmUpload = (file, data) => {
  const form = new FormData()
  form.append('file', file)
  form.append('activity_id', data.activity_id)
  form.append('optimized_name', data.optimized_name)
  form.append('file_type', data.file_type)
  form.append('tags', JSON.stringify(data.tags || []))
  form.append('key_info', data.key_info || '')
  return client.post('/upload', form).then((r) => r.data)
}

// ---------- 检索 ----------
export const searchMaterials = (params) =>
  client.get('/search', { params }).then((r) => r.data)

export const fetchAllTags = () => client.get('/search/tags').then((r) => r.data)

export const fetchAllTypes = () => client.get('/search/types').then((r) => r.data)

export const fetchAllActivityTypes = () =>
  client.get('/search/activity-types').then((r) => r.data)

// ---------- 文件 ----------
export const downloadFileUrl = (id) => `/api/files/${id}/download`
export const previewFileUrl = (id) => `/api/files/${id}/preview`

export const deleteMaterial = (id) => client.delete(`/files/${id}`).then((r) => r.data)

// ---------- 压缩包预览 ----------
export const fetchArchiveList = (id) =>
  client.get(`/files/${id}/archive`).then((r) => r.data)

export const archiveEntryUrl = (id, path) =>
  `/api/files/${id}/archive/entry?path=${encodeURIComponent(path)}`

// ---------- Setting ----------
export const fetchDeletedMaterials = () =>
  client.get('/settings/recycle-bin/materials').then((r) => r.data)

export const fetchDeletedActivities = () =>
  client.get('/settings/recycle-bin/activities').then((r) => r.data)

export const restoreMaterial = (id) =>
  client.post(`/settings/recycle-bin/materials/${id}/restore`).then((r) => r.data)

export const permanentDeleteMaterial = (id) =>
  client.delete(`/settings/recycle-bin/materials/${id}`).then((r) => r.data)

export const restoreActivity = (id) =>
  client.post(`/settings/recycle-bin/activities/${id}/restore`).then((r) => r.data)

export const permanentDeleteActivity = (id) =>
  client.delete(`/settings/recycle-bin/activities/${id}`).then((r) => r.data)

export const fetchMembers = () => client.get('/settings/members').then((r) => r.data)

export const updateMemberRole = (id, role) =>
  client.put(`/settings/members/${id}`, { role }).then((r) => r.data)
