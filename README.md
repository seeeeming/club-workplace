# 社团成长中心 · 完整平台

一个校园社团活动管理平台：**新建活动（6 步流程）+ AI 策划助手 + 活动资料归档 + 复盘沉淀经验**。

> 本仓库是**完整可运行**的整套平台（前端 + 两个后端服务），克隆下来配置好 API key 即可跑。

> 👥 **项目组成员必读**：[队友 GitHub 协作指南](team-git-guide.md) —— 怎么在 GitHub 上提交你的部分、怎么避免冲突。

---

## ⚙️ 平台由 3 个服务组成（缺一不可）

| 服务 | 端口 | 位置 | 技术 | 作用 |
|---|---|---|---|---|
| 平台前端 | 5173 | 仓库根目录 | Vue 3 + Vite | 网页界面；把 `/api` 请求转发给后端 |
| 资料库后端 | 8000 | `AIClub_database-main/backend` | Python FastAPI | 活动档案、资料检索、上传 |
| AI 助手 | 3000 | `AI+club/AI+club` | Node.js（零依赖） | 调用 DeepSeek 大模型生成策划案 |

**前端通过 Vite 代理转发请求**：`/api/deepseek/*` → 3000，其他 `/api/*` → 8000。
所以只跑前端、不跑后两端的话，**资料库和 AI 都会失效**（这也是"AI 没反应"最常见的原因）。

---

## 🚀 一键启动（推荐）

双击 `start-demo.bat`（放在仓库根目录；需已安装 Node.js 和 Python）。

会弹出 3 个服务窗口，等窗口稳定后：

- 本机访问：**http://localhost:5173**
- 局域网（同一校园网/WiFi）访问：**http://你的局域网IP:5173**

**三个服务窗口不要关**，别人访问时你的电脑也要保持开机、不休眠。

---

## 🔧 手动启动（三个终端）

```bash
# 1) 资料库后端（端口 8000）
cd AIClub_database-main/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# 2) AI 助手（端口 3000，需先配置 key，见下）
cd AI+club/AI+club
node server.js

# 3) 平台前端（端口 5173）
npm install
npm run dev
```

---

## 🤖 配置 AI（DeepSeek）

AI 助手**真实调用 DeepSeek 大模型**，不是假的。需要你自己的 API key：

1. 到 https://platform.deepseek.com 注册，创建 API key
2. 把 `AI+club/AI+club/.env.example` 复制为 `.env`，填入 key：

   ```
   DEEPSEEK_API_KEY=sk-你的key
   ```

3. 重启 AI 服务（端口 3000 的窗口），看到日志 `deepseekKeyLoaded=true` 即成功

> ⚠️ `.env` 已被 `.gitignore` 排除，**绝对不要提交 key 到任何仓库**。

### AI 助手是「两步式」，别误以为没接 AI

| 你做的操作 | 后台行为 | 耗时 |
|---|---|---|
| 输入一句活动想法直接回车 | **本地模板**秒回「3 个创意方向 + 可行性打分」 | 即时（不调 AI） |
| 点「**生成策划案**」 | **真实调用 DeepSeek** 生成完整策划案 + 可行性报告 | 约 10 秒 |

如果你只发了句话、没点「生成策划案」，看到的是本地模板回复——那是**正常设计**（为了快、不花钱），不代表没接 AI。

---

## 📚 功能清单

- **社团工作台**：新建活动 6 步流程（策划 → 预算 → 采购 → 执行 → 照片 → 完成）、草稿 / 进行中 / 待复盘 / 已完成 状态
- **AI 策划助手**：工作台右下角「AI」浮标；资料库侧栏也有完整页入口（`/ai/create.html?embed=archive-planner`），参考历史活动、一键回填策划案
- **社团资料库**：活动档案（列表/详情）、资料检索、上传（React 版，构建产物在 `public/archive/`）
- **复盘与成长**：完成活动后「去复盘」→ 评分 + AI 提炼经验/风险 → 沉淀进资料库；成长等级 / 称号徽章

---

## 📁 目录结构

```
仓库根目录（即 Vue 平台）
├── src/                    # Vue 平台前端源码
├── public/
│   ├── ai/create.html      # AI 策划助手页面（Vue/资料库 iframe 嵌入用）
│   └── archive/            # 资料库前端构建产物（/archive/ 访问）
├── AI+club/AI+club/        # AI 助手 Node 服务（真正调 DeepSeek 的）
│   ├── server.js
│   ├── .env.example        # 复制为 .env 并填 key
│   └── create.html         # AI 助手完整页（源码）
├── AIClub_database-main/
│   ├── backend/            # 资料库 FastAPI 后端（SQLite）
│   │   ├── app/            #   路由 / 服务 / 配置
│   │   ├── activity_archive.db
│   │   └── requirements.txt
│   └── frontend/           # 资料库 React 前端源码
│       └── vite.config.js  #   build 输出到仓库 public/archive/
├── start-demo.bat          # 一键启动 3 个服务
├── vite.config.ts          # Vue 前端配置（含 /api 代理到 8000/3000）
└── README.md
```

---

## ❓ 常见问题

- **页面能开，但资料库没数据 / AI 报错？** → 8000 或 3000 服务没启动，看对应的窗口日志。
- **AI 窗口提示 `Missing DEEPSEEK_API_KEY`？** → 没配置 `.env`，见上文。
- **同学在别的地方打不开？** → 需要和你在**同一校园网/WiFi**；且你的电脑没关机、没休眠、防火墙放行 5173。
- **修改了资料库前端源码？** → 重建：`cd AIClub_database-main/frontend && npm install && npm run build`，产物自动进 `public/archive/`。
- **局域网 IP 变了？** → `ipconfig` 查看当前 IPv4，把新地址发给同学即可。

---

## 版权说明

原型项目，用于课程作业 / 社团内部演示。DeepSeek 调用需要你自己付费的 API key。
