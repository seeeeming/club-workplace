import { useNavigate } from 'react-router-dom'

/**
 * AI 活动策划助手入口（资料库侧栏预留）。
 * 接入的是工作台（create.html）里右下角那个「AI 策划助手」的完整页面版：
 * create.html 通过 ?embed=archive-planner 进入嵌入模式，自动打开 AI 助手主界面
 * （对话 + 历史会话 + 参考资料库活动 + 策划案预览），并隐藏活动表单。
 * 资料库界面被全屏接管；「← 返回资料库」按钮在左上角。
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
      {/* 浮动返回资料库按钮（左上角，避免与顶部居中的「返回平台」重叠） */}
      <button className="floating-back" onClick={() => navigate('/activities')}>
        ← 返回资料库
      </button>
    </>
  )
}
