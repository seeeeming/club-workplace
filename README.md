# 社团成长中心 · Reflection 复盘模块原型

基于产品设计文档实现的原型，覆盖「登录 → 社团平台 → 活动完成 → 复盘 → 知识沉淀 → 成长反馈」完整用户流。

## 技术栈

- Vue 3 + TypeScript
- Vite 5
- Pinia（状态管理，localStorage 持久化）
- Vue Router

## 如何运行

> 需要先安装 [Node.js](https://nodejs.org/)（LTS 即可）。

```bash
cd reflection-prototype
npm install
npm run dev
```

浏览器打开终端里提示的地址（默认 http://localhost:5173）。

## 平台架构

进入平台前需要**先登录**（原型：输入名字即可）。登录后是**主页三卡片**，含三个功能：

| 功能 | 路由 | 说明 |
| --- | --- | --- |
| 🗂️ 社团工作台 | `/platform/workspace` | 活动列表 + 新建活动入口 |
| 📖 社长手册 | `/platform/handbook` | **占位**（由其他同学开发） |
| 📚 社团资料库 | `/platform/kb` | 历届沉淀的经验 / 风险 |

其他页面：

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 登录 | `/login` | 输入名字进入平台 |
| 主页三卡片 | `/platform` | 登录后落地页 |
| 新建活动（全屏工作台） | `/workspace/create` | 同学的 8 步流程，全屏 iframe 嵌入 |
| Reflection 流程 | `/reflection/:activityId` | 评分 → 经历 → 自适应追问 → 提炼经验 → 保存 |
| 我的成长 | `/growth` | 个人主页：成长数据 + 等级演示 + 历史记录 |

## 活动工作台

- 工作台展示**活动列表**（标题 / 封面 / 完成日期 / 复盘状态），未复盘的活动显示「去复盘 →」。
- 点「＋ 新建活动」进入 **全屏 8 步流程**（同学的工作台 `public/workspace.html` 以 iframe 全屏嵌入，保持横屏布局）。
- **照片必传**：完成活动前必须上传活动照片（Step 6 校验）。
- 完成后弹出「要不要复盘」询问；侧栏 🪞 复盘入口也可随时进入最近未复盘的活动。
- Vue 与工作台 iframe 通过 `postMessage` 通信（见 `src/composables/useWorkspaceBridge.ts`）。

## Reflection 引导流程（重点）

1. **评分**：1~5 星
2. **个人经历（Q1）**：AI 先问「这次活动你做了什么」——个人经历，**只进活动记录，不进知识库**
3. **自适应追问（Q2）**：AI 根据 Q1 回答里的**关键词**（宣传/预算/场地/分工/时间/现场/设备/意外…），自动生成更相关的经验追问
4. **提炼**：只把「经验总结」（Q2）提炼成知识条目，用户编辑、增删、确认后保存
5. **沉淀**：确认的内容进入社团资料库，个人经历保留在活动记录

### 自适应追问关键词

```
招新/宣传 → 前期宣传经验
预算/经费 → 预算物资经验
场地/教室 → 场地安排经验
分工/队友 → 团队配合经验
时间/迟到 → 时间计划经验
观众/到场 → 现场体验经验
设备/音响 → 设备避坑经验
意外/失败 → 意外应对经验
```

## 关键设计点

- **AI 不编造**：`src/data/aiEngine.ts` 用规则实现「提炼」，只梳理用户表达、分类，最终由用户确认后才保存
- **只提炼经验**：`distillExperience` 只处理 `kind === 'experience'` 的回答，个人经历不进入知识库
- **成长体系**：`src/data/growth.ts` 配置 4 个等级（🌱→🌿→🌳→⭐），按 Reflection 次数解锁
- **登录守卫**：路由守卫拦截未登录访问，登录后自动跳转主页
- **横屏布局**：全站桌面横屏，无移动端窄屏约束；工作台 8 步流程全屏展示

## 目录结构

```
src/
├── composables/
│   └── useWorkspaceBridge.ts   # 工作台 iframe ↔ Vue 的 postMessage 桥接
├── data/
│   ├── aiEngine.ts             # 模拟 AI：自适应追问 + 提炼经验
│   └── growth.ts               # 成长等级配置
├── stores/
│   └── growth.ts               # Pinia：登录/活动/复盘/知识/成长 + 持久化
├── components/
│   ├── AiBubble.vue            # AI 对话气泡
│   └── StarRating.vue          # 五星评分
├── router/
│   └── index.ts                # 路由 + 登录守卫
├── views/
│   ├── LoginView.vue           # 登录页
│   ├── PlatformHomeView.vue    # 主页三卡片
│   ├── PlatformLayout.vue      # 平台壳（横屏顶栏）
│   ├── workspace/
│   │   ├── WorkspaceView.vue     # 社团工作台：活动列表 + 新建入口
│   │   └── CreateWorkspaceView.vue # 全屏 iframe 8 步流程
│   ├── HandbookView.vue        # 社长手册（占位）
│   ├── KnowledgeBaseView.vue   # 社团资料库
│   ├── ReflectionView.vue      # 复盘主流程（横屏）
│   └── GrowthProfileView.vue   # 我的成长（个人主页）
public/
└── workspace.html              # 同学的工作台（8 步流程，原样保留）
```
