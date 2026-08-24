import { NavLink, Route, Routes } from 'react-router-dom'
import ActivitiesPage from './pages/ActivitiesPage.jsx'
import ActivityDetailPage from './pages/ActivityDetailPage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import AIPlannerPage from './pages/AIPlannerPage.jsx'

export default function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">📚 社团活动资料库</div>
        <nav>
          <NavLink to="/activities" end>
            🗂️ 活动档案
          </NavLink>
          <NavLink to="/search">🔍 资料检索</NavLink>
          <NavLink to="/upload">📤 上传资料</NavLink>
          <NavLink to="/ai-planner">🤖 AI活动策划助手</NavLink>
          <NavLink to="/settings">⚙️ 设置</NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ActivitiesPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/ai-planner" element={<AIPlannerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}
