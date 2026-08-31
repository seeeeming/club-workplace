import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { renderAsync } from 'docx-preview'
import * as XLSX from 'xlsx'
import { init as initPptx } from 'pptx-preview'
import {
  deleteActivity,
  deleteMaterial,
  fetchActivity,
  fetchActivityMaterials,
  previewFileUrl,
  downloadFileUrl,
  fetchArchiveList,
  archiveEntryUrl,
} from '../api'
import {
  IconBack,
  IconCalendar,
  IconClose,
  IconDownload,
  IconEye,
  IconFile,
  IconFolder,
  IconTrash,
} from '../components/Icons.jsx'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
const PDF_EXTENSIONS = ['pdf']
const TEXT_EXTENSIONS = ['txt', 'md', 'csv', 'log', 'json', 'xml', 'html', 'htm', 'yaml', 'yml', 'ini', 'cfg', 'conf']
const DOCX_EXTENSIONS = ['doc', 'docx']
const XLSX_EXTENSIONS = ['xls', 'xlsx', 'xlsm']
const PPTX_EXTENSIONS = ['ppt', 'pptx']
const ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz']

function getFileExt(name) {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

function isImage(name) {
  return IMAGE_EXTENSIONS.includes(getFileExt(name))
}

// 预览类型：image 图片 / pdf / text 文本 / docx Word / xlsx Excel / pptx PPT / archive 压缩包 / other 其他
function getPreviewType(name) {
  const ext = getFileExt(name)
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  if (PDF_EXTENSIONS.includes(ext)) return 'pdf'
  if (TEXT_EXTENSIONS.includes(ext)) return 'text'
  if (DOCX_EXTENSIONS.includes(ext)) return 'docx'
  if (XLSX_EXTENSIONS.includes(ext)) return 'xlsx'
  if (PPTX_EXTENSIONS.includes(ext)) return 'pptx'
  if (ARCHIVE_EXTENSIONS.includes(ext)) return 'archive'
  return 'other'
}

function typeClass(type) {
  const map = {
    '百团大战': 'baituan',
    '社团文化节': 'festival',
    '周常活动': 'weekly',
    '创新活动': 'innovate',
  }
  return map[type] || 'other'
}

export default function ActivityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activity, setActivity] = useState(null)
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  // 压缩包预览状态
  const [archiveEntries, setArchiveEntries] = useState([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [innerPreview, setInnerPreview] = useState(null) // 压缩包内正在预览的文件

  // 渲染容器 ref
  const docxRef = useRef(null)
  const pptxRef = useRef(null)

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

  // 打开预览：若为压缩包则加载包内文件列表
  const openPreview = async (m) => {
    setInnerPreview(null)
    setArchiveEntries([])
    setPreview(m)
    if (getPreviewType(m.optimized_name) === 'archive') {
      setArchiveLoading(true)
      try {
        const data = await fetchArchiveList(m.id)
        setArchiveEntries(data.entries || [])
      } catch (e) {
        setArchiveEntries([])
      } finally {
        setArchiveLoading(false)
      }
    }
  }

  const closePreview = () => {
    setPreview(null)
    setInnerPreview(null)
    setArchiveEntries([])
  }

  // 渲染 Word 文档（url 为文件地址）
  const renderDocx = async (url) => {
    try {
      const res = await fetch(url)
      const buffer = await res.arrayBuffer()
      if (docxRef.current) {
        docxRef.current.innerHTML = ''
        await renderAsync(buffer, docxRef.current)
      }
    } catch (e) {
      if (docxRef.current) docxRef.current.innerHTML = '<div class="preview-render-error">Word 文档渲染失败</div>'
    }
  }

  // 渲染 Excel 表格
  const renderXlsx = async (url) => {
    try {
      const res = await fetch(url)
      const buffer = await res.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const html = XLSX.utils.sheet_to_html(sheet, { id: 'xlsx-table' })
      const container = docxRef.current
      if (container) {
        container.innerHTML = `<div class="xlsx-header">${sheetName}</div>${html}`
      }
    } catch (e) {
      if (docxRef.current) docxRef.current.innerHTML = '<div class="preview-render-error">Excel 表格渲染失败</div>'
    }
  }

  // 渲染 PPT
  const renderPptx = async (url) => {
    try {
      const res = await fetch(url)
      const buffer = await res.arrayBuffer()
      if (pptxRef.current) {
        pptxRef.current.innerHTML = ''
        const viewer = initPptx(pptxRef.current, { width: 960, height: 540 })
        viewer.preview(buffer)
      }
    } catch (e) {
      if (pptxRef.current) pptxRef.current.innerHTML = '<div class="preview-render-error">PPT 渲染失败</div>'
    }
  }

  // 点击压缩包内文件：可预览则打开，否则提示不支持
  const handleInnerClick = (entry) => {
    const type = getPreviewType(entry.name)
    if (type === 'other' || type === 'archive') {
      window.alert('该文件类型暂不支持在线预览，请下载后查看')
      return
    }
    setInnerPreview(entry)
  }

  // 当 preview 变化时，触发 docx/xlsx/pptx 渲染
  useEffect(() => {
    if (!preview) return
    const type = getPreviewType(preview.optimized_name)
    if (type === 'docx') renderDocx(previewFileUrl(preview.id))
    else if (type === 'xlsx') renderXlsx(previewFileUrl(preview.id))
    else if (type === 'pptx') renderPptx(previewFileUrl(preview.id))
  }, [preview])

  // 当 innerPreview 变化时，触发压缩包内 docx/xlsx/pptx 渲染
  useEffect(() => {
    if (!innerPreview || !preview) return
    const type = getPreviewType(innerPreview.name)
    const url = archiveEntryUrl(preview.id, innerPreview.name)
    if (type === 'docx') renderDocx(url)
    else if (type === 'xlsx') renderXlsx(url)
    else if (type === 'pptx') renderPptx(url)
  }, [innerPreview])

  if (loading) return <div className="loading">加载中...</div>
  if (error) return <div className="alert error">{error}</div>
  if (!activity) return <div className="empty-state">活动不存在</div>

  const types = activity.activity_types && activity.activity_types.length > 0
    ? activity.activity_types
    : activity.type
      ? [activity.type]
      : []

  const previewType = preview ? getPreviewType(preview.optimized_name) : null
  const innerType = innerPreview ? getPreviewType(innerPreview.name) : null

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/activities')}>
          <IconBack />
        </button>
        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>返回活动档案</span>
      </div>

      <div className={`detail-hero detail-${typeClass(types[0] || '其他')}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <h1>{activity.name}</h1>
            <div className="hero-meta">
              <span>
                <IconCalendar />
                {activity.date || '未设置时间'}
              </span>
              {types.map((t) => (
                <span key={t} className="type-badge">{t}</span>
              ))}
            </div>
          </div>
          <button className="btn danger" onClick={handleDelete}>
            <IconTrash /> 删除活动
          </button>
        </div>
      </div>

      {/* 相关资料 */}
      <div className="section-title">
        <IconFolder />
        相关资料（{materials.length}）
      </div>
      {materials.length === 0 ? (
        <div className="empty-state">
          <div className="icon">
            <IconFile width={28} height={28} />
          </div>
          <div className="empty-title">该活动暂无资料</div>
          <div className="empty-desc">可到"上传资料"页面添加</div>
        </div>
      ) : (
        materials.map((m) => (
          <div key={m.id} className="material-item">
            <div className="info">
              <div className="name">
                <IconFile width={15} height={15} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--text-weak)' }} />
                {m.optimized_name}
              </div>
              <div className="sub">
                <span style={{ marginRight: 12 }}>类型：{m.file_type || '未分类'}</span>
                {m.tags.map((t) => (
                  <span key={t.id} className="tag">#{t.name}</span>
                ))}
              </div>
            </div>
            <div className="actions">
              <button className="icon-btn" title="预览" onClick={() => openPreview(m)}>
                <IconEye />
              </button>
              <a className="icon-btn" title="下载" href={downloadFileUrl(m.id)} download>
                <IconDownload />
              </a>
              <button className="icon-btn danger" title="删除" onClick={() => handleDeleteMaterial(m.id)}>
                <IconTrash />
              </button>
            </div>
          </div>
        ))
      )}

      {/* 资料预览弹窗 */}
      {preview && (
        <div className="preview-modal" onClick={closePreview}>
          <button className="close" onClick={closePreview}>
            <IconClose />
          </button>

          {/* 图片 */}
          {previewType === 'image' && (
            <img
              src={previewFileUrl(preview.id)}
              alt={preview.optimized_name}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* PDF / 文本 */}
          {(previewType === 'pdf' || previewType === 'text') && (
            <iframe
              className="preview-frame"
              src={previewFileUrl(preview.id)}
              title={preview.optimized_name}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Word */}
          {previewType === 'docx' && (
            <div className="preview-docx" onClick={(e) => e.stopPropagation()}>
              <div className="preview-toolbar">
                <span className="preview-toolbar-name">{preview.optimized_name}</span>
                <a className="btn small" href={downloadFileUrl(preview.id)} download>
                  <IconDownload /> 下载
                </a>
              </div>
              <div className="preview-docx-body" ref={docxRef} />
            </div>
          )}

          {/* Excel */}
          {previewType === 'xlsx' && (
            <div className="preview-docx" onClick={(e) => e.stopPropagation()}>
              <div className="preview-toolbar">
                <span className="preview-toolbar-name">{preview.optimized_name}</span>
                <a className="btn small" href={downloadFileUrl(preview.id)} download>
                  <IconDownload /> 下载
                </a>
              </div>
              <div className="preview-xlsx-body" ref={docxRef} />
            </div>
          )}

          {/* PPT */}
          {previewType === 'pptx' && (
            <div className="preview-docx" onClick={(e) => e.stopPropagation()}>
              <div className="preview-toolbar">
                <span className="preview-toolbar-name">{preview.optimized_name}</span>
                <a className="btn small" href={downloadFileUrl(preview.id)} download>
                  <IconDownload /> 下载
                </a>
              </div>
              <div className="preview-pptx-body" ref={pptxRef} />
            </div>
          )}

          {/* 压缩包：包内文件列表 */}
          {previewType === 'archive' && (
            <div className="preview-archive" onClick={(e) => e.stopPropagation()}>
              <div className="preview-toolbar">
                <span className="preview-toolbar-name">{preview.optimized_name}</span>
                <a className="btn small" href={downloadFileUrl(preview.id)} download>
                  <IconDownload /> 下载压缩包
                </a>
              </div>
              {archiveLoading ? (
                <div className="archive-loading">正在读取压缩包内容...</div>
              ) : archiveEntries.length === 0 ? (
                <div className="archive-empty">压缩包内没有可预览的文件</div>
              ) : (
                <div className="archive-list">
                  {archiveEntries.map((entry) => {
                    const t = getPreviewType(entry.name)
                    const previewable = t !== 'other' && t !== 'archive'
                    return (
                      <div
                        key={entry.name}
                        className={`archive-entry ${previewable ? 'clickable' : ''}`}
                        onClick={() => handleInnerClick(entry)}
                        title={previewable ? '点击预览' : '该文件类型暂不支持在线预览'}
                      >
                        <IconFile width={15} height={15} />
                        <span className="archive-entry-name">{entry.name}</span>
                        <span className="archive-entry-size">
                          {entry.size > 1024 * 1024
                            ? (entry.size / 1024 / 1024).toFixed(1) + ' MB'
                            : entry.size > 1024
                              ? (entry.size / 1024).toFixed(1) + ' KB'
                              : entry.size + ' B'}
                        </span>
                        {!previewable && <span className="archive-entry-unsupported">不支持预览</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 其他类型 */}
          {previewType === 'other' && (
            <div className="preview-fallback" onClick={(e) => e.stopPropagation()}>
              <IconFile width={40} height={40} />
              <div className="preview-fallback-name">{preview.optimized_name}</div>
              <div className="preview-fallback-desc">
                该文件类型暂不支持在线预览，请下载后查看
              </div>
              <a className="btn" href={downloadFileUrl(preview.id)} download>
                <IconDownload /> 下载文件
              </a>
            </div>
          )}
        </div>
      )}

      {/* 压缩包内文件预览弹窗 */}
      {innerPreview && (
        <div className="preview-modal inner" onClick={() => setInnerPreview(null)}>
          <button className="close" onClick={() => setInnerPreview(null)}>
            <IconClose />
          </button>
          <div className="inner-header" onClick={(e) => e.stopPropagation()}>
            <button className="back-btn" onClick={() => setInnerPreview(null)}>
              <IconBack />
            </button>
            <span className="inner-title">{innerPreview.name}</span>
          </div>

          {innerType === 'image' && (
            <img
              src={archiveEntryUrl(preview.id, innerPreview.name)}
              alt={innerPreview.name}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {(innerType === 'pdf' || innerType === 'text') && (
            <iframe
              className="preview-frame"
              src={archiveEntryUrl(preview.id, innerPreview.name)}
              title={innerPreview.name}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {innerType === 'docx' && (
            <div className="preview-docx" onClick={(e) => e.stopPropagation()}>
              <div className="preview-toolbar">
                <span className="preview-toolbar-name">{innerPreview.name}</span>
              </div>
              <div className="preview-docx-body" ref={docxRef} />
            </div>
          )}

          {innerType === 'xlsx' && (
            <div className="preview-docx" onClick={(e) => e.stopPropagation()}>
              <div className="preview-toolbar">
                <span className="preview-toolbar-name">{innerPreview.name}</span>
              </div>
              <div className="preview-xlsx-body" ref={docxRef} />
            </div>
          )}

          {innerType === 'pptx' && (
            <div className="preview-docx" onClick={(e) => e.stopPropagation()}>
              <div className="preview-toolbar">
                <span className="preview-toolbar-name">{innerPreview.name}</span>
              </div>
              <div className="preview-pptx-body" ref={pptxRef} />
            </div>
          )}

          {innerType === 'other' && (
            <div className="preview-fallback" onClick={(e) => e.stopPropagation()}>
              <IconFile width={40} height={40} />
              <div className="preview-fallback-name">{innerPreview.name}</div>
              <div className="preview-fallback-desc">
                该文件类型暂不支持在线预览，请下载后查看
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
