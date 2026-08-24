import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeUpload, confirmUpload, createActivity, fetchActivities } from '../api'
import { ACTIVITY_TYPES } from '../constants'

export default function UploadPage() {
  const [activities, setActivities] = useState([])
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [showNewActivity, setShowNewActivity] = useState(false)
  const [newActivity, setNewActivity] = useState({ name: '', date: '' })
  const [selectedType, setSelectedType] = useState('')
  const [file, setFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null) // { optimized_name, file_type, tags, key_info }
  const [tagsInput, setTagsInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const navigate = useNavigate()

  useEffect(() => {
    fetchActivities().then(setActivities).catch(() => {})
  }, [])

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    setFile(f)
    setAiResult(null)
    setMessage({ type: '', text: '' })
    // 选择文件后不立即触发 AI，需等 Step2 选择所属活动后再自动识别
  }

  // 根据当前所选/新建活动解析活动名称
  const resolveActivityName = () => {
    if (selectedActivityId) {
      const act = activities.find((a) => a.id === Number(selectedActivityId))
      return act ? act.name : ''
    }
    return newActivity.name
  }

  // 判断是否已确定所属活动（选择已有活动 或 填写了新活动名称）
  const isActivityReady = () => {
    if (selectedActivityId) return true
    if (showNewActivity && newActivity.name.trim()) return true
    return false
  }

  // 对指定文件执行 AI 自动识别（文件 + 所属活动上下文）
  const runAutoAnalyze = async (fileToAnalyze) => {
    if (!fileToAnalyze) return
    const activityName = resolveActivityName()
    setAnalyzing(true)
    setMessage({ type: '', text: '' })
    try {
      const result = await analyzeUpload(fileToAnalyze, activityName)
      setAiResult(result)
      setTagsInput(result.tags.join(', '))
    } catch (e) {
      setMessage({ type: 'error', text: 'AI 分析失败，请重试' })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      setMessage({ type: 'error', text: '请先选择文件' })
      return
    }
    if (!isActivityReady()) {
      setMessage({ type: 'error', text: '请先选择或填写所属活动' })
      return
    }
    await runAutoAnalyze(file)
  }

  const handleConfirm = async () => {
    if (!file || !aiResult) return
    // 确定所属活动
    let activityId = Number(selectedActivityId)
    if (showNewActivity || !activityId) {
      if (!newActivity.name.trim()) {
        setMessage({ type: 'error', text: '请填写新活动名称' })
        return
      }
      if (!selectedType) {
        setMessage({ type: 'error', text: '请选择一个活动类型' })
        return
      }
      try {
        const created = await createActivity({ ...newActivity, activity_types: [selectedType] })
        activityId = created.id
      } catch (e) {
        setMessage({ type: 'error', text: '创建活动失败' })
        return
      }
    }
    const tags = tagsInput.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
    setUploading(true)
    try {
      await confirmUpload(file, {
        activity_id: activityId,
        optimized_name: aiResult.optimized_name,
        file_type: aiResult.file_type,
        tags,
        key_info: aiResult.key_info,
      })
      setMessage({ type: 'success', text: '资料已成功归档！' })
      setFile(null)
      setAiResult(null)
      setTagsInput('')
      // 跳转到活动详情
      navigate(`/activities/${activityId}`)
    } catch (e) {
      setMessage({ type: 'error', text: '归档失败，请重试' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">上传资料</h1>
      <p className="page-desc">上传活动资料，AI 将自动识别类型、生成标签并优化文件名</p>

      {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}

      {/* Step 1: 选择文件 */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Step 1 · 选择文件</h3>
        <input type="file" onChange={handleFileChange} />
        {file && (
          <p style={{ marginTop: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
            已选择：{file.name}（{(file.size / 1024).toFixed(1)} KB）
          </p>
        )}
      </div>

      {/* Step 2: 选择所属活动 */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Step 2 · 选择资料所属活动</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
          <select
            className="select"
            style={{ width: 300 }}
            value={selectedActivityId}
            onChange={(e) => {
              setSelectedActivityId(e.target.value)
              if (e.target.value) setShowNewActivity(false)
              // 仅在选择活动，不自动触发 AI；需用户点击"开始 AI 分析"按钮
            }}
          >
            <option value="">-- 选择已有活动 --</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <span style={{ color: 'var(--text-secondary)' }}>或</span>
          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              setShowNewActivity(!showNewActivity)
              setSelectedActivityId('')
            }}
          >
            {showNewActivity ? '取消新建' : '＋ 创建新活动档案'}
          </button>
        </div>
        {showNewActivity && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">活动名称 *</label>
                <input
                  className="input"
                  value={newActivity.name}
                  onChange={(e) => {
                    setNewActivity({ ...newActivity, name: e.target.value })
                    // 仅填写活动名称，不自动触发 AI；需用户点击"开始 AI 分析"按钮
                  }}
                  placeholder="如：2026迎新交流会"
                />
              </div>
              <div>
                <label className="label">活动时间</label>
                <input
                  className="input date-input"
                  type="date"
                  value={newActivity.date}
                  onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">活动类型（单选）*</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ACTIVITY_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`type-option ${selectedType === type ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="newActivityType"
                      checked={selectedType === type}
                      onChange={() => setSelectedType(type)}
                      style={{ display: 'none' }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: AI 分析 */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Step 3 · AI 自动整理</h3>
        <button
          className="btn"
          onClick={handleAnalyze}
          disabled={!file || !isActivityReady() || analyzing}
        >
          {analyzing ? 'AI 分析中...' : '🤖 开始 AI 分析'}
        </button>
        {(!file || !isActivityReady()) && (
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            请先完成 Step 1 选择文件、Step 2 选择所属活动，再点击上方按钮进行 AI 分析。
          </p>
        )}
        {file && isActivityReady() && (
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            已满足 Step 1 与 Step 2，点击上方按钮即可让 AI 识别并生成标签。
          </p>
        )}

        {aiResult && (
          <div style={{ marginTop: 20, background: 'var(--primary-light)', padding: 16, borderRadius: 8 }}>
            <h4 style={{ marginBottom: 12, color: 'var(--primary)' }}>AI 整理建议（可修改）</h4>
            <div style={{ marginBottom: 12 }}>
              <label className="label">优化后文件名</label>
              <input
                className="input"
                value={aiResult.optimized_name}
                onChange={(e) => setAiResult({ ...aiResult, optimized_name: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="label">文件类型</label>
              <input
                className="input"
                value={aiResult.file_type}
                onChange={(e) => setAiResult({ ...aiResult, file_type: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="label">标签（用逗号分隔）</label>
              <input
                className="input"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="#招新, #新生, #宣传"
              />
            </div>
            <button className="btn" onClick={handleConfirm} disabled={uploading}>
              {uploading ? '归档中...' : '✅ 确认并归档'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
