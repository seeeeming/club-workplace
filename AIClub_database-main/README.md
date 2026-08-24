# 社团活动资料库

AI+大学社团管理平台中的**活动资料库**板块。用于存放社团活动资料，AI 自动识别增设标签辅助用户调取文件或关键字检索文件，以整理并找到过往的活动资料。

## 功能模块

| 模块 | 说明 |
|------|------|
| 🗂️ 活动档案 | 查看所有历史活动卡片，进入活动详情页查看基本信息、AI 摘要、相关资料、Reflection 入口 |
| 🔍 资料检索 | 通过关键词、标签、文件类型检索历史资料，查看详情并跳转对应活动档案 |
| 📤 上传资料 | 上传活动文件，AI 自动识别文件类型、生成标签、优化文件名、提取关键信息，用户确认后归档 |
| ⚙️ Setting | 管理回收站（恢复/永久删除）、成员权限 |

## 技术栈

- **前端**：React 18 + Vite + React Router + Axios
- **后端**：Python + FastAPI + SQLAlchemy
- **数据库**：SQLite
- **文件存储**：本地文件系统
- **AI**：DeepSeek 大模型（MVP 阶段默认用规则模拟，可配置接入真实 API）

## 项目结构

```
activity-archive/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── main.py          # 应用入口
│   │   ├── config.py        # 配置
│   │   ├── models.py        # SQLAlchemy 数据模型
│   │   ├── schemas.py       # Pydantic 模型
│   │   ├── database.py      # 数据库连接
│   │   ├── ai/              # AI 服务（analyzer.py 规则模拟 + DeepSeek 接入）
│   │   ├── services/        # 业务服务（文件存储、标签）
│   │   └── routers/         # API 路由（activities/upload/search/settings/files）
│   ├── storage/             # 上传文件存储目录
│   ├── seed.py              # 种子数据脚本
│   ├── requirements.txt
│   └── .env.example         # 环境变量示例
└── frontend/                # React 前端
    └── src/
        ├── pages/           # 页面（Activities/Search/Upload/Settings/Detail）
        ├── api/             # Axios API 封装
        ├── App.jsx          # 路由与布局
        └── index.css        # 全局样式
```

## 运行方式

### 1. 启动后端

```bash
cd backend
# 安装依赖（Python 3.9+）
pip install -r requirements.txt

# 填充种子数据（可选，含示例活动与资料）
python -m seed

# 启动服务
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

后端 API 文档：http://127.0.0.1:8000/docs

### 2. 启动前端

```bash
cd frontend
# 安装依赖（需要 Node.js 18+）
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

> 前端通过 Vite 代理将 `/api` 请求转发到后端 `http://127.0.0.1:8000`，无需额外配置。

## AI 能力配置

MVP 阶段默认使用**规则/关键词模拟** AI 能力（无需 API Key）。

如需接入真实 DeepSeek 大模型：

1. 复制 `.env.example` 为 `.env`
2. 填入 `DEEPSEEK_API_KEY`
3. 设置 `AI_ENABLED=true`

```env
DEEPSEEK_API_KEY=你的APIKey
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
AI_ENABLED=true
```

AI 能力包括：
- **文件类型识别**：根据文件名与内容识别（策划案/预算表/海报/照片/视频/物资清单/问卷等）
- **标签生成**：自动生成主题标签（如 #招新 #新生 #宣传）
- **文件名优化**：生成规范命名 `活动名-资料类型.扩展名`
- **关键信息提取**：提取年份、资料类型等关键信息
- **活动摘要**：汇总活动资料生成 AI 摘要

## 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/activities` | 活动列表 |
| POST | `/api/activities` | 创建活动 |
| GET | `/api/activities/{id}` | 活动详情 |
| GET | `/api/activities/{id}/materials` | 活动资料列表 |
| POST | `/api/activities/{id}/summary` | 生成活动摘要 |
| POST | `/api/upload/analyze` | 上传并 AI 分析 |
| POST | `/api/upload` | 确认归档资料 |
| GET | `/api/search` | 资料检索 |
| GET | `/api/files/{id}/download` | 下载文件 |
| GET | `/api/files/{id}/preview` | 预览文件（图片内联展示） |
| GET | `/api/settings/recycle-bin/*` | 回收站 |
| GET/PUT | `/api/settings/members` | 成员权限 |
