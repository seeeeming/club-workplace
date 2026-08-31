import { NavLink, Route, Routes } from 'react-router-dom'
import ActivitiesPage from './pages/ActivitiesPage.jsx'
import ActivityDetailPage from './pages/ActivityDetailPage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import AIPlannerPage from './pages/AIPlannerPage.jsx'
import {
  IconArchive,
  IconSearch,
  IconUpload,
  IconSpark,
  IconSettings,
} from './components/Icons.jsx'

export default function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-mark">
            <IconArchive width={20} height={20} />
          </span>
          <span className="logo-text">
            社团活动资料库
            <span className="logo-sub">CLUB ARCHIVE</span>
          </span>
        </div>
        <nav>
          <NavLink to="/activities" end>
            <IconArchive /> 活动档案
          </NavLink>
          <NavLink to="/search">
            <IconSearch /> 资料检索
          </NavLink>
          <NavLink to="/upload">
            <IconUpload /> 上传资料
          </NavLink>
          <NavLink to="/ai-planner">
            <IconSpark /> AI活动策划助手
          </NavLink>
          <NavLink to="/settings">
            <IconSettings /> 设置
          </NavLink>
        </nav>
        <div className="sidebar-foot">校园社团 · 成长中心</div>
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
