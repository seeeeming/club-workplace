# 社团成长中心 · 队友 GitHub 协作指南

> 给项目组所有人看的。**GitHub 不是网盘**——它是「大家共同改同一份代码、git 自动合并」的地方。
> 只要照下面做，你改完的东西会自动合进主代码，不用再把文件发给组长。

---

## 一、给组长（负责人）：先把门打开（只需一次）

1. 打开仓库：`https://github.com/seeeeming/club-workplace`
2. 点右上角 **Settings** → 左侧 **Collaborators** → 点 **Add people**
3. 输入队员的 **GitHub 用户名**（不是昵称）→ 点确定
4. 让队员去自己邮箱里点「**接受邀请**」的链接

> 只要这一步做完，队员就能自己提交了，之后的合并都是 git 自动做。

---

## 二、给每位队员：第一次准备（每台电脑只做一次）

### 1. 注册 GitHub（没有的话）
- 打开 `https://github.com` → Sign up
- 注册完把**用户名**告诉组长（组长加你进仓库）

### 2. 安装 Git
- 下载：`https://git-scm.com/download/win` → 一路「下一步」装完

### 3. 设置你的姓名和邮箱（只一次）
- 开始菜单 → 搜索并打开 **Git Bash**（装完 Git 后就有）
- 输入下面两行（把名字邮箱换成你自己的，GitHub 邮箱）

```bash
git config --global user.name "你的名字"
git config --global user.email "你的GitHub邮箱"
```

### 4. 把代码下载到电脑（只一次）
```bash
git clone https://github.com/seeeeming/club-workplace.git
cd club-workplace
```

---

## 三、三条铁律（务必遵守）

| 规则 | 说明 |
|---|---|
| **只改自己负责的文件夹** | 平台组改根目录（`src`、`public` 等）；资料库组改 `AIClub_database-main`；AI 组改 `AI+club`。碰别人的文件夹 = 制造冲突 |
| **绝不提交密钥** | 不要动 `.env` 文件，不要把 API key 写进任何代码。`.gitignore` 已自动挡住 `.env`，但你自己也别往里塞 |
| **不要手动改 `public/archive/`** | 那是资料库「自动生成」的产物，你改了下次生成会被覆盖。要改资料库界面就改 `AIClub_database-main/frontend/` |

> 因为大家各改各的文件夹，**几乎永远不会冲突**——这是本项目最适合 GitHub 协作的原因。

---

## 四、每次开工前（重要！）

先同步大家的最新改动：

```bash
git pull
```

显示 `Already up to date` 就是已经最新了。

---

## 五、改完怎么提交（3 条命令）

```bash
git add 你改的那个文件夹
git commit -m "说明你这次改了啥"
git push
```

举例（资料库组）：
```bash
git add AIClub_database-main
git commit -m "资料库新增活动导出功能"
git push
```

> 注意：**新建的文件也要 `git add` 才会被提交**，git 不会自动带上新文件。
> 想看自己改了哪些：`git status`。

---

## 六、组长怎么确认改动（网页上，10 秒）

队员 `push` 后，你在仓库页点 **Commits** 就能看到每个人的提交记录，点进去能看每一处改动。

如果哪次改坏了：仓库页 Commits → 找到上一次正常的那条 → 点 `< >` 按钮进入该版本 → 告诉组长可以回退，git 全程有记录，**不会丢代码**。

---

## 七、进阶（可选）：每人一个分支 + Pull Request

想更正式、每个人改动更独立时用这个。**普通协作先用上面的直推方式就行。**

```bash
# 1) 建自己的分支（只一次，用名字拼音）
git checkout -b wangfang

# 2) 开工前同步最新（用这条代替 git pull）
git fetch
git merge origin/main

# 3) 正常改、正常提交
git add 你的文件夹
git commit -m "说明改了啥"
git push -u origin wangfang
```

然后网页上发起合并：
1. 仓库页会出现黄色提示「wangfang had recent pushes」→ 点 **Compare & pull request**
2. 填标题 → 点 **Create pull request**
3. 组长在网页上点 **Merge pull request** 合并

---

## 八、常见问题

| 情况 | 怎么办 |
|---|---|
| `git push` 报错、被拒绝 | 先 `git pull` 再重新 push |
| `git pull` 提示 `CONFLICT`（冲突） | 说明你俩改了同一个文件。**别乱删**，把组长喊来，git 可以安全处理 |
| 忘了自己改了啥 | `git status` |
| 想放弃某个文件的改动 | `git checkout -- 文件名` |
| 提示跟 `.env` / 密钥有关 | 千万不要提交，马上告诉组长 |
| 不知道从哪下手 | 先 `git pull` 保证最新，再打开 `README.md` 看项目结构 |

---

## 九、最后一句

> 改坏了、卡住了，**都不用慌**——git 会保留每一次改动，总能回退到正常版本。
> 第一次用 git 的同学前几次提交找组长看着做一遍，第二次就会了。
