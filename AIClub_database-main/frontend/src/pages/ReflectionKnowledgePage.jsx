import { useCallback, useEffect, useState } from 'react'

// Vue 平台（同源 localhost:5173）Reflection 模块持久化的 key
const STORAGE_KEY = 'club-reflection-store-v1'

/**
 * 读取 Vue 平台 Reflection 沉淀到 localStorage 的经验/风险知识。
 * 该页面是社团资料库里的一个子目录：Reflection 内容同样属于资料库的一部分。
 */
function readKnowledge() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.knowledge) ? parsed.knowledge : []
  } catch {
    return []
  }
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const TYPE_META = {
  experience: { label: '📚 经验', color: '#4f6ef7', bg: '#eef1ff' },
  risk: { label: '⚠️ 风险', color: '#b45309', bg: '#fef3e2' },
  process: { label: '🗂️ 流程记录', color: '#16a34a', bg: '#e7f6ec' },
}

export default function ReflectionKnowledgePage() {
  const [filter, setFilter] = useState('all')
  const [knowledge, setKnowledge] = useState([])

  const refresh = useCallback(() => setKnowledge(readKnowledge()), [])

  useEffect(() => {
    refresh()
    // Vue 平台新增 Reflection 写入 localStorage 时，实时刷新本页
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [refresh])

  const list = knowledge
    .filter((k) => filter === 'all' || k.type === filter)
    .slice()
    .reverse()

  const counts = {
    experience: knowledge.filter((k) => k.type === 'experience').length,
    risk: knowledge.filter((k) => k.type === 'risk').length,
    process: knowledge.filter((k) => k.type === 'process').length,
  }

  const chipStyle = (active) => ({
    padding: '7px 14px',
    borderRadius: 20,
    border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
    background: active ? 'var(--primary)' : '#fff',
    color: active ? '#fff' : 'var(--text-secondary)',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: active ? 600 : 500,
  })

  return (
    <div>
      <h1 className="page-title">📝 Reflection 沉淀</h1>
      <p className="page-desc">
        这里沉淀的是每次活动复盘后 AI 提炼、你确认过的经验与风险提醒，同样属于社团资料库的一部分。
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button style={chipStyle(filter === 'all')} onClick={() => setFilter('all')}>
          全部（{knowledge.length}）
        </button>
        <button style={chipStyle(filter === 'experience')} onClick={() => setFilter('experience')}>
          📚 经验（{counts.experience}）
        </button>
        <button style={chipStyle(filter === 'risk')} onClick={() => setFilter('risk')}>
          ⚠️ 风险（{counts.risk}）
        </button>
        <button style={chipStyle(filter === 'process')} onClick={() => setFilter('process')}>
          🗂️ 流程记录（{counts.process}）
        </button>
      </div>

      {list.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((item) => {
            const meta = TYPE_META[item.type] || TYPE_META.experience
            return (
              <div key={item.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      background: meta.bg,
                      color: meta.color,
                    }}
                  >
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {fmtDate(item.createdAt)}
                  </span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {item.content}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">🌱</div>
          <p>还没有沉淀的知识</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            回到平台完成一次活动复盘，提炼的经验会出现在这里
          </p>
        </div>
      )}
    </div>
  )
}
