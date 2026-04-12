# Mini Tab - 书签管理

智能书签管理与 Prompt 工具，替代你的新标签页。

## ✨ 功能

- 📑 智能书签管理
- 🔖 快捷新标签页
- 🛠️ Prompt 管理工具

## 📦 安装

### 方式一：从 Releases 下载（推荐）

1. 前往 [Releases](../../releases) 页面
2. 下载最新版本的 `mini-tab-extension.zip`
3. 解压 ZIP 文件到一个文件夹
4. 打开 Chrome 浏览器，访问 `chrome://extensions/`
5. 开启右上角 **「开发者模式」**
6. 点击 **「加载已解压的扩展程序」**
7. 选择解压后的文件夹

### 方式二：从源码构建

```bash
# 克隆仓库
git clone https://github.com/你的用户名/minitab-v2.git
cd minitab-v2

# 安装依赖
npm install

# 构建 Chrome 扩展
npm run build:crx
```

构建完成后，`dist/` 文件夹即为扩展程序，按照上述步骤 4-7 加载 `dist/` 文件夹即可。

## 🔄 更新

1. 前往 [Releases](../../releases) 页面下载最新版本
2. 解压并替换旧文件夹中的所有内容
3. 在 `chrome://extensions/` 页面点击扩展卡片上的刷新按钮

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动 CRX 开发模式
npm run dev:crx

# 构建
npm run build:crx
```

## 🚀 发版流程

> ⚠️ GitHub Actions 构建仅在 **push tag `v*`** 时触发，push 代码到 main 分支不会触发构建。

完整的发版步骤：

```bash
# 1. 提交所有代码改动
git add -A
git commit -m "feat/fix/perf: 你的改动描述"

# 2. 更新版本号（三个文件都要改）
#    - package.json       → "version": "x.y.z"
#    - manifest.json      → "version": "x.y.z"
#    - update-manifest.json → "version": "x.y.z" + releaseDate + changelog

# 3. 提交版本号变更
git add -A
git commit -m "chore: bump version to x.y.z"

# 4. 打 tag 并推送（这一步触发 CI 构建）
git tag vx.y.z
git push origin main --tags
```

**常见问题**：代码推送后 Actions 没有新构建 → 检查是否忘记打 tag。

## 📄 License

MIT
