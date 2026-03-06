# 产品 PRD：Prompt Manager — Web 端 Prompt 管理工具

## 一、项目背景

现有网站 `minitab-v2` 是一个基于 **React + Vite + shadcn/ui + Tailwind CSS** 的应用，目前包含三个页面路由：

| 路由 | 页面 | 状态 |
|------|------|------|
| `/bookmarks` | 书签管理 | ✅ 已完成 |
| `/explore` | 发现 | 🔲 占位 |
| `/tools` | 智能工具 | 🔲 占位（显示"开发中"） |

Prompt Manager 将作为 `/tools` 路由下的**核心功能模块**集成进现有网站，复用现有的布局系统、主题系统、认证系统和 UI 组件库。

---

## 二、功能需求

### 2.1 核心功能

| 功能模块 | 描述 |
|----------|------|
| **项目管理** | 创建/重命名/删除 Prompt 项目，切换活跃项目 |
| **Prompt 编辑** | Monaco Editor 编写 Prompt（Markdown），实时自动保存草稿 |
| **模型配置** | 添加/编辑/删除/启用 AI 模型（OpenAI 兼容格式），支持配置 CORS 代理 |
| **API 测试** | 将 Prompt 发送给已启用的模型，展示响应结果和 Token 用量 |
| **版本管理** | 保存 Prompt 版本快照（含模型响应），查看/恢复/删除历史版本 |

### 2.2 页面布局

Prompt Manager 嵌入 `/tools` 路由，在 `MainContent` 区域内采用**三栏布局**：

```
┌─────────────────────────────────────────────────────────┐
│  [现有 Sidebar]  │          MainContent (tools)          │
│                  │  ┌──────┬──────────────┬──────────┐  │
│                  │  │项目  │  编辑器       │ 版本历史  │  │
│  发现             │  │列表  │              │          │  │
│  智能工具 ←active │  │      │  [Monaco]    │ v1 12:00 │  │
│  我的书签         │  │ Proj1│              │ v2 13:00 │  │
│                  │  │ Proj2│──────────────│ v3 14:00 │  │
│                  │  │ Proj3│  响应面板     │          │  │
│                  │  │      │  [Model Resp]│          │  │
│                  │  └──────┴──────────────┴──────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 三、技术方案

### 3.1 技术栈（完全复用现有项目）

| 技术 | 说明 |
|------|------|
| React 18 + TypeScript | 现有框架 |
| Vite | 现有构建工具 |
| Tailwind CSS + CSS Variables | 现有样式系统（含亮/暗主题） |
| shadcn/ui (Radix) | 现有 UI 组件（Dialog, Button, Input, ScrollArea, Tooltip 等） |
| react-router-dom | 现有路由 |
| Monaco Editor (`@monaco-editor/react`) | **新增依赖**，代码编辑器 |
| localStorage | 数据持久化 |

### 3.2 新增文件结构

```
src/
├── pages/
│   └── ToolsPage.tsx                    # 改造：从占位页变为 Prompt Manager 入口
├── components/
│   └── prompt-manager/                  # ✨ 新增目录
│       ├── PromptLayout.tsx             # 三栏布局容器
│       ├── ProjectSidebar.tsx           # 左栏：项目列表
│       ├── PromptEditor.tsx             # 中栏：编辑器 + 工具栏
│       ├── ResponsePanel.tsx            # 中栏下部：API 响应面板
│       ├── VersionHistory.tsx           # 右栏：版本历史
│       └── ModelConfigDialog.tsx        # 弹窗：模型配置
├── contexts/
│   └── PromptContext.tsx                # ✨ 新增：Prompt 项目状态管理
├── hooks/
│   └── usePromptProjects.ts            # ✨ 新增：项目 CRUD Hook
├── services/
│   └── promptStorage.ts                # ✨ 新增：localStorage 存储服务
│   └── aiApi.ts                        # ✨ 新增：AI API 调用服务
├── types/
│   └── index.ts                        # 扩展：添加 Prompt 相关类型
```

### 3.3 类型定义

```typescript
// 新增类型（追加到 src/types/index.ts）

export interface PromptProject {
  id: string
  name: string
  prompt: string
  versions: PromptVersion[]
  created_at: string
  updated_at: string
}

export interface PromptVersion {
  id: string
  prompt: string
  responses: ModelResponse[]
  created_at: string
}

export interface ModelResponse {
  model_name: string
  content: string
  token_usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  created_at: string
}

export interface ModelConfig {
  id: string
  name: string            // 显示名称，如 "DeepSeek Chat"
  model_name: string      // API 模型标识，如 "deepseek-chat"
  api_endpoint: string    // 完整 API URL
  api_key: string
  enabled: boolean
  proxy_url?: string      // 可选 CORS 代理地址
  temperature?: number    // 可选温度参数
}
```

### 3.4 各组件职责

| 组件 | 职责 | 交互 |
|------|------|------|
| **`ToolsPage.tsx`** | 入口页，挂载 `PromptProvider` + `PromptLayout` | 替换现有占位内容 |
| **`PromptLayout.tsx`** | 三栏布局容器（20% / 55% / 25%），可拖拽调整 | flex 布局 |
| **`ProjectSidebar.tsx`** | 项目列表 + 新建/搜索/删除 | Dialog 创建项目 |
| **`PromptEditor.tsx`** | Monaco Editor + 工具栏（保存/发送/设置按钮） | 编辑器 onChange 自动保存 |
| **`ResponsePanel.tsx`** | 模型响应展示（可拖拽高度），多模型 Tab 切换 | 只读展示 |
| **`VersionHistory.tsx`** | 版本列表 + 查看详情/恢复/删除 | Dialog 查看详情 |
| **`ModelConfigDialog.tsx`** | 模型 CRUD + 启用开关 + API Key 验证 | shadcn Dialog |
| **`PromptContext.tsx`** | 全局状态：projects / activeProject / models | React Context |
| **`promptStorage.ts`** | localStorage CRUD 封装 | 异步接口 |
| **`aiApi.ts`** | fetch 调用 AI API，支持 CORS 代理 | Promise |

### 3.5 风格适配

完全复用现有主题变量，确保与书签页视觉一致：

- 亮色/暗色主题自动跟随（`useTheme`）
- Monaco Editor 主题：亮色用 `vs`，暗色用 `vs-dark`，跟随全局切换
- 卡片/边框/阴影复用现有 Tailwind 类（`bg-background`, `border-border`, `shadow-card` 等）
- 间距和圆角保持一致（`rounded-xl`, `gap-3`, `p-3` 等）

### 3.6 API 调用方案（解决浏览器 CORS）

与 Electron 版不同，Web 端没有内置代理。方案：

- 模型配置中新增可选字段 `proxy_url`
- 如果填写了代理地址，请求先发到代理再转发
- 如果 API 本身支持 CORS（如部分国内 AI 服务），可直连

---

## 四、实施步骤

| 步骤 | 内容 | 涉及文件 |
|------|------|----------|
| 1 | 安装 `@monaco-editor/react` + `monaco-editor` 依赖 | `package.json` |
| 2 | 扩展类型定义 | `src/types/index.ts` |
| 3 | 实现存储服务 | `src/services/promptStorage.ts` |
| 4 | 实现 API 调用服务 | `src/services/aiApi.ts` |
| 5 | 实现 PromptContext 状态管理 | `src/contexts/PromptContext.tsx` |
| 6 | 实现 ProjectSidebar 组件 | `src/components/prompt-manager/ProjectSidebar.tsx` |
| 7 | 实现 PromptEditor + ResponsePanel | `src/components/prompt-manager/PromptEditor.tsx` + `ResponsePanel.tsx` |
| 8 | 实现 VersionHistory 组件 | `src/components/prompt-manager/VersionHistory.tsx` |
| 9 | 实现 ModelConfigDialog | `src/components/prompt-manager/ModelConfigDialog.tsx` |
| 10 | 实现 PromptLayout 三栏布局 | `src/components/prompt-manager/PromptLayout.tsx` |
| 11 | 改造 ToolsPage 作为入口 | `src/pages/ToolsPage.tsx` |
| 12 | Monaco 主题适配（亮/暗色跟随） | PromptEditor 内部处理 |

---

## 五、与原 Electron 版本的对比

| 方面 | 原版（Electron） | Web 版（集成到 minitab-v2） |
|------|-------------------|---------------------------|
| UI 框架 | MUI (Material) | shadcn/ui + Tailwind（与现有网站统一） |
| 主题 | 仅暗色 | 亮色/暗色双主题 |
| 标题栏 | macOS 无边框 | 无（集成到现有布局） |
| API 跨域 | Electron 内置代理 | 用户可配置代理 / 直连 |
| Monaco 加载 | 本地文件 | CDN 自动加载 |
| 数据存储 | localStorage | localStorage（相同） |
| 路由 | 无（单页面） | `/tools` 路由 |
| 布局 | 独立窗口三栏 | 嵌入现有 Sidebar + MainContent |
| 新增功能 | — | 项目搜索、亮暗主题适配、代理配置、温度参数 |

---

## 六、总结

核心思路：**将 Prompt Manager 作为 `/tools` 页面的内容，完全融入现有的 minitab-v2 网站，复用现有的 Sidebar 导航、主题系统、认证体系和 UI 组件库，只需新增一个 `prompt-manager` 组件目录和少量服务文件。**
