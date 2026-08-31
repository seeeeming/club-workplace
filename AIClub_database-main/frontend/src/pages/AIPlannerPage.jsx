import { useNavigate } from 'react-router-dom'

/**
 * AI 活动策划助手入口（资料库侧栏）。
 * 全屏嵌入 create.html 的嵌入模式（?embed=archive-planner），页面加载后自动打开 AI 助手主界面
 * （对话 + 历史会话 + 参考资料库活动 + 策划案预览）。
 * 说明：AI 请求走同源 /api/deepseek，由平台 Vite 代理到 AI 助手 Node 服务（3000）；
 *       参考资料库的活动来自 /api/activities（FastAPI 8000）。
 */
export default function AIPlannerPage() {
  const navigate = useNavigate()

  return (
    <>
      {/* 全屏嵌入 AI 活动策划助手（create.html 的嵌入模式） */}
      <iframe
        className="ai-planner-frame"
        src="/ai/create.html?embed=archive-planner"
        title="AI 活动策划助手"
      />
      {/* 浮动返回资料库按钮（左上角，避免与 AI 主界面顶部按钮重叠） */}
      <button className="floating-back" onClick={() => navigate('/activities')}>
        ← 返回资料库
      </button>
    </>
  )
}
