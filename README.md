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

MIT
