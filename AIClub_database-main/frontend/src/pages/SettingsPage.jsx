import { useEffect, useState } from 'react'
import {
  fetchDeletedActivities,
  fetchDeletedMaterials,
  fetchMembers,
  permanentDeleteActivity,
  permanentDeleteMaterial,
  restoreActivity,
  restoreMaterial,
  updateMemberRole,
} from '../api'

export default function SettingsPage() {
  const [tab, setTab] = useState('recycle')
  const [deletedMaterials, setDeletedMaterials] = useState([])
  const [deletedActivities, setDeletedActivities] = useState([])
  const [members, setMembers] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })

  const loadRecycle = async () => {
    try {
      const [mats, acts] = await Promise.all([
        fetchDeletedMaterials(),
        fetchDeletedActivities(),
      ])
      setDeletedMaterials(mats)
      setDeletedActivities(acts)
    } catch (e) {
      setMessage({ type: 'error', text: '加载回收站失败' })
    }
  }

  const loadMembers = async () => {
    try {
      setMembers(await fetchMembers())
    } catch (e) {
      setMessage({ type: 'error', text: '加载成员失败' })
    }
  }

  useEffect(() => {
    loadRecycle()
    loadMembers()
  }, [])

  const handleRestoreMaterial = async (id) => {
    await restoreMaterial(id)
    setMessage({ type: 'success', text: '资料已恢复' })
    loadRecycle()
  }

  const handlePermanentDeleteMaterial = async (id) => {
    if (!window.confirm('确定永久删除该资料？此操作不可恢复！')) return
    await permanentDeleteMaterial(id)
    setMessage({ type: 'success', text: '资料已永久删除' })
    loadRecycle()
  }

  const handleRestoreActivity = async (id) => {
    await restoreActivity(id)
    setMessage({ type: 'success', text: '活动已恢复' })
    loadRecycle()
  }

  const handlePermanentDeleteActivity = async (id) => {
    if (!window.confirm('确定永久删除该活动及其所有资料？此操作不可恢复！')) return
    await permanentDeleteActivity(id)
    setMessage({ type: 'success', text: '活动已永久删除' })
    loadRecycle()
  }

  const handleRoleChange = async (id, role) => {
    await updateMemberRole(id, role)
    setMessage({ type: 'success', text: '成员权限已更新' })
    loadMembers()
  }

  return (
    <div>
      <h1 className="page-title">设置</h1>
      <p className="page-desc">管理资料库设置：回收站、成员权限、数据管理</p>

      {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          className={tab === 'recycle' ? 'btn' : 'btn ghost'}
          onClick={() => setTab('recycle')}
        >
          🗑️ 最近删除
        </button>
        <button
          className={tab === 'members' ? 'btn' : 'btn ghost'}
          onClick={() => setTab('members')}
        >
          👥 成员权限
        </button>
      </div>

      {tab === 'recycle' && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>已删除的活动</h2>
          {deletedActivities.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>暂无已删除的活动</p>
          ) : (
            <table className="table" style={{ marginBottom: 24 }}>
              <thead>
                <tr>
                  <th>活动名称</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {deletedActivities.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.date}</td>
                    <td>
                      <button className="btn secondary" style={{ marginRight: 8 }} onClick={() => handleRestoreActivity(a.id)}>
                        恢复
                      </button>
                      <button className="btn danger" onClick={() => handlePermanentDeleteActivity(a.id)}>
                        永久删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 style={{ fontSize: 18, marginBottom: 12 }}>已删除的资料</h2>
          {deletedMaterials.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>暂无已删除的资料</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>文件名</th>
                  <th>类型</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {deletedMaterials.map((m) => (
                  <tr key={m.id}>
                    <td>{m.optimized_name}</td>
                    <td>{m.file_type}</td>
                    <td>
                      <button className="btn secondary" style={{ marginRight: 8 }} onClick={() => handleRestoreMaterial(m.id)}>
                        恢复
                      </button>
                      <button className="btn danger" onClick={() => handlePermanentDeleteMaterial(m.id)}>
                        永久删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>成员权限管理</h2>
          <table className="table">
            <thead>
              <tr>
                <th>成员</th>
                <th>角色</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.username}</td>
                  <td>
                    <span className="tag">{m.role === 'admin' ? '管理员' : '普通成员'}</span>
                  </td>
                  <td>
                    <select
                      className="select"
                      style={{ width: 140 }}
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    >
                      <option value="admin">管理员</option>
                      <option value="member">普通成员</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
