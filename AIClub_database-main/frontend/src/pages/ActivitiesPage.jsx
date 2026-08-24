import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createActivity, fetchActivities } from '../api'
import { ACTIVITY_TYPES } from '../constants'

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', date: '' })
  const [selectedType, setSelectedType] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchActivities()
      setActivities(data)
    } catch (e) {
      setError('加载活动列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('请输入活动名称')
      return
    }
    if (!selectedType) {
      setError('请选择一个活动类型')
      return
    }
    try {
      const activity = await createActivity({ ...form, activity_types: [selectedType] })
      setShowCreate(false)
      setForm({ name: '', date: '' })
      setSelectedType('')
      setError('')
      navigate(`/activities/${activity.id}`)
    } catch (err) {
      setError('创建活动失败')
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">活动档案</h1>
          <p className="page-desc">查看社团过去举办过的所有活动</p>
        </div>
        <button className="btn" onClick={() => setShowCreate(!showCreate)}>
          ＋ 新建活动档案
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {showCreate && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>创建新的活动档案</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">活动名称 *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="如：2025迎新交流会"
                />
              </div>
              <div>
                <label className="label">活动时间</label>
                <input
                  className="input date-input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">活动类型（单选）*</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ACTIVITY_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`type-option ${selectedType === type ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="activityType"
                      checked={selectedType === type}
                      onChange={() => setSelectedType(type)}
                      style={{ display: 'none' }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn" type="submit">创建</button>
              <button className="btn ghost" type="button" onClick={() => setShowCreate(false)}>
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {activities.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🗂️</div>
          <p>暂无活动档案，点击"新建活动档案"开始创建</p>
        </div>
      ) : (
        <div className="activity-grid">
          {activities.map((a) => (
            <div
              key={a.id}
              className="activity-card"
              onClick={() => navigate(`/activities/${a.id}`)}
            >
              <h3>{a.name}</h3>
              <div className="meta">
                <span>📅 {a.date || '未设置时间'}</span>
                {(a.activity_types && a.activity_types.length > 0
                  ? a.activity_types
                  : a.type
                    ? [a.type]
                    : []
                ).map((t) => (
                  <span key={t} className="type-badge">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
