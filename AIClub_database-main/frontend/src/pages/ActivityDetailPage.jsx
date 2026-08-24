import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteActivity,
  deleteMaterial,
  fetchActivity,
  fetchActivityMaterials,
  previewFileUrl,
  downloadFileUrl,
} from '../api'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']

function isImage(name) {
  const ext = name.split('.').pop().toLowerCase()
  return IMAGE_EXTENSIONS.includes(ext)
}

export default function ActivityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activity, setActivity] = useState(null)
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [act, mats] = await Promise.all([
        fetchActivity(id),
        fetchActivityMaterials(id),
      ])
      setActivity(act)
      setMaterials(mats)
    } catch (e) {
      setError('加载活动详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('确定删除该活动及其所有资料吗？（可到 Setting 回收站恢复）')) return
    try {
      await deleteActivity(id)
      navigate('/activities')
    } catch (e) {
      setError('删除失败')
    }
  }

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('确定删除该资料吗？（可到 Setting 回收站恢复）')) return
    try {
      await deleteMaterial(materialId)
      setMaterials((prev) => prev.filter((m) => m.id !== materialId))
    } catch (e) {
      setError('删除资料失败')
    }
  }

  if (loading) return <div className="loading">加载中...</div>
  if (error) return <div className="alert error">{error}</div>
  if (!activity) return <div className="empty-state">活动不存在</div>

  return (
    <div>
      <Link to="/activities" style={{ color: 'var(--primary)', fontSize: 14 }}>
        ← 返回活动档案
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 }}>
        <div>
          <h1 className="page-title">{activity.name}</h1>
          <div className="meta" style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span>📅 {activity.date || '未设置时间'}</span>
            {(activity.activity_types && activity.activity_types.length > 0
              ? activity.activity_types
              : activity.type
                ? [activity.type]
                : []
            ).map((t) => (
              <span key={t} className="type-badge">{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn danger" onClick={handleDelete}>
            🗑️ 删除活动
          </button>
        </div>
      </div>

      {/* 相关资料 */}
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>相关资料（{materials.length}）</h2>
      {materials.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📄</div>
          <p>该活动暂无资料，可到"上传资料"页面添加</p>
        </div>
      ) : (
        materials.map((m) => (
          <div key={m.id} className="material-item">
            <div className="info">
              <div className="name">📄 {m.optimized_name}</div>
              <div className="sub">
                <span style={{ marginRight: 12 }}>类型：{m.file_type || '未分类'}</span>
                {m.tags.map((t) => (
                  <span key={t.id} className="tag">#{t.name}</span>
                ))}
              </div>
            </div>
            <div className="actions">
              {isImage(m.optimized_name) && (
                <button className="btn secondary" onClick={() => setPreview(m)}>
                  👁️ 预览
                </button>
              )}
              <a className="btn ghost" href={downloadFileUrl(m.id)} download>
                ⬇️ 下载
              </a>
              <button className="btn danger" onClick={() => handleDeleteMaterial(m.id)}>
                🗑️ 删除
              </button>
            </div>
          </div>
        ))
      )}

      {/* 图片预览弹窗 */}
      {preview && (
        <div className="preview-modal" onClick={() => setPreview(null)}>
          <button className="close" onClick={() => setPreview(null)}>×</button>
          <img src={previewFileUrl(preview.id)} alt={preview.optimized_name} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
