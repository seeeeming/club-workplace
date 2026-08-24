import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  downloadFileUrl,
  fetchAllActivityTypes,
  fetchAllTypes,
  previewFileUrl,
  searchMaterials,
} from '../api'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']

function isImage(name) {
  const ext = name.split('.').pop().toLowerCase()
  return IMAGE_EXTENSIONS.includes(ext)
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState('')
  const [fileType, setFileType] = useState('')
  const [activityType, setActivityType] = useState('')
  const [allTypes, setAllTypes] = useState([])
  const [allActivityTypes, setAllActivityTypes] = useState([])
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAllTypes().then(setAllTypes).catch(() => {})
    fetchAllActivityTypes().then(setAllActivityTypes).catch(() => {})
  }, [])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const data = await searchMaterials({
        q: keyword,
        file_type: fileType,
        activity_type: activityType,
      })
      setResults(data.materials)
      setTotal(data.total)
    } catch (e) {
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div>
      <h1 className="page-title">资料检索</h1>
      <p className="page-desc">通过关键词、文件类型、活动类型查找历史资料</p>

      <div className="search-bar">
        <input
          className="input"
          placeholder="输入关键词，如：讲座策划案、招新海报、预算表..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn" onClick={handleSearch}>🔍 搜索</button>
      </div>

      <div className="filters">
        <select className="select" value={fileType} onChange={(e) => setFileType(e.target.value)}>
          <option value="">文件类型</option>
          {allTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className="select"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
        >
          <option value="">活动类型</option>
          {allActivityTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className="btn ghost" onClick={handleSearch}>应用筛选</button>
      </div>

      {loading && <div className="loading">搜索中...</div>}

      {!loading && total > 0 && (
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14 }}>
          共找到 {total} 条资料
        </p>
      )}

      {!loading && total === 0 && (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <p>未找到匹配的资料，请尝试其他关键词</p>
        </div>
      )}

      {results.map((m) => (
        <div key={m.id} className="material-item">
          <div className="info">
            <div className="name">📄 {m.optimized_name}</div>
            <div className="sub">
              <span style={{ marginRight: 12 }}>类型：{m.file_type || '未分类'}</span>
              <span style={{ marginRight: 12 }}>
                所属活动：
                <a
                  href="#"
                  style={{ color: 'var(--primary)' }}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/activities/${m.activity_id}`)
                  }}
                >
                  {m.activity_name}
                </a>
              </span>
              <span style={{ marginRight: 12 }}>📅 {m.activity_date || '未知时间'}</span>
              {(m.activity_types || []).map((t) => (
                <span key={t} className="type-badge">{t}</span>
              ))}
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
          </div>
        </div>
      ))}

      {preview && (
        <div className="preview-modal" onClick={() => setPreview(null)}>
          <button className="close" onClick={() => setPreview(null)}>×</button>
          <img src={previewFileUrl(preview.id)} alt={preview.optimized_name} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
