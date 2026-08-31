import { IconSpark } from '../components/Icons.jsx'

export default function AIPlannerPage() {
  return (
    <div>
      <h1 className="page-title">AI 活动策划助手</h1>
      <p className="page-desc">该板块由其他同事负责设计开发，敬请期待</p>

      <div className="empty-state">
        <div className="icon">
          <IconSpark width={28} height={28} />
        </div>
        <div className="empty-title">AI 活动策划助手</div>
        <div className="empty-desc">功能开发中，敬请期待</div>
      </div>
    </div>
  )
}
