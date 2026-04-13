/**
 * 发现页数据服务
 * 负责：
 * 1. 维护细分类别网站推荐（内置 + 网络更新）
 * 2. 爬取热门网站排行（综合热度 + AI 热度）
 * 3. 本地缓存 + 每 4 小时定时刷新
 */

// ==================== 类型定义 ====================

export interface ExploreSite {
  name: string
  url: string
  description: string
  favicon: string
  /** 热度分数 (0-100) */
  heat?: number
  /** 标签 */
  tags?: string[]
}

export interface ExploreCategory {
  id: string
  name: string
  icon: string
  sites: ExploreSite[]
}

export interface HotSite {
  rank: number
  name: string
  url: string
  description: string
  favicon: string
  heat: number
  /** 变化趋势: up / down / stable */
  trend: "up" | "down" | "stable"
  /** 分类标签 */
  category: string
}

export interface ExploreData {
  categories: ExploreCategory[]
  hotSites: HotSite[]
  aiHotSites: HotSite[]
  lastUpdated: string
}

// ==================== 缓存管理 ====================

const CACHE_KEY = "minitab_explore_data"
const CACHE_TTL = 4 * 60 * 60 * 1000 // 4 小时

function getCachedData(): ExploreData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as ExploreData
    const elapsed = Date.now() - new Date(cached.lastUpdated).getTime()
    if (elapsed > CACHE_TTL) return null
    return cached
  } catch {
    return null
  }
}

function setCachedData(data: ExploreData): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))
}

// ==================== 内置网站分类数据 ====================

const BUILTIN_CATEGORIES: ExploreCategory[] = [
  {
    id: "ai-tools",
    name: "AI 工具",
    icon: "🤖",
    sites: [
      { name: "ChatGPT", url: "https://chat.openai.com", description: "OpenAI 旗舰对话 AI，支持文本、图像、代码多模态", favicon: "https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64" },
      { name: "Claude", url: "https://claude.ai", description: "Anthropic 推出的安全可靠 AI 助手", favicon: "https://www.google.com/s2/favicons?domain=claude.ai&sz=64" },
      { name: "元宝", url: "https://yuanbao.tencent.com", description: "腾讯推出的 AI 智能助手，深度思考与搜索", favicon: "https://www.google.com/s2/favicons?domain=yuanbao.tencent.com&sz=64" },
      { name: "Gemini", url: "https://gemini.google.com", description: "Google 多模态 AI 助手，整合搜索与创作", favicon: "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64" },
      { name: "Perplexity", url: "https://www.perplexity.ai", description: "AI 搜索引擎，实时检索与智能总结", favicon: "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64" },
      { name: "Kimi", url: "https://kimi.moonshot.cn", description: "月之暗面出品，擅长长文本理解与分析", favicon: "https://www.google.com/s2/favicons?domain=kimi.moonshot.cn&sz=64" },
    ],
  },
  {
    id: "ai-image",
    name: "AI 绘画",
    icon: "🎨",
    sites: [
      { name: "Midjourney", url: "https://www.midjourney.com", description: "顶级 AI 绘画工具，艺术风格细腻", favicon: "https://www.google.com/s2/favicons?domain=midjourney.com&sz=64" },
      { name: "即梦", url: "https://jimeng.jianying.com", description: "字节跳动 AI 创作平台，支持图片和视频生成", favicon: "https://www.google.com/s2/favicons?domain=jimeng.jianying.com&sz=64" },
      { name: "Stable Diffusion", url: "https://stability.ai", description: "开源 AI 图像生成模型，本地可部署", favicon: "https://www.google.com/s2/favicons?domain=stability.ai&sz=64" },
      { name: "DALL·E", url: "https://openai.com/dall-e-3", description: "OpenAI 图像生成模型，已集成至 ChatGPT", favicon: "https://www.google.com/s2/favicons?domain=openai.com&sz=64" },
      { name: "Leonardo.ai", url: "https://leonardo.ai", description: "专业 AI 图像生成平台，适合游戏和设计", favicon: "https://www.google.com/s2/favicons?domain=leonardo.ai&sz=64" },
    ],
  },
  {
    id: "dev-tools",
    name: "开发工具",
    icon: "💻",
    sites: [
      { name: "GitHub", url: "https://github.com", description: "全球最大代码托管平台与开源社区", favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=64" },
      { name: "Stack Overflow", url: "https://stackoverflow.com", description: "最大的程序员问答社区", favicon: "https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=64" },
      { name: "MDN Web Docs", url: "https://developer.mozilla.org", description: "Web 技术权威文档与教程", favicon: "https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=64" },
      { name: "npm", url: "https://www.npmjs.com", description: "JavaScript 包管理与发现平台", favicon: "https://www.google.com/s2/favicons?domain=npmjs.com&sz=64" },
      { name: "CodePen", url: "https://codepen.io", description: "在线前端代码编辑器与社区", favicon: "https://www.google.com/s2/favicons?domain=codepen.io&sz=64" },
      { name: "Vercel", url: "https://vercel.com", description: "前端部署平台，Next.js 官方维护", favicon: "https://www.google.com/s2/favicons?domain=vercel.com&sz=64" },
    ],
  },
  {
    id: "design",
    name: "设计资源",
    icon: "✨",
    sites: [
      { name: "Dribbble", url: "https://dribbble.com", description: "设计师作品展示与灵感发现平台", favicon: "https://www.google.com/s2/favicons?domain=dribbble.com&sz=64" },
      { name: "Behance", url: "https://www.behance.net", description: "Adobe 旗下创意作品展示平台", favicon: "https://www.google.com/s2/favicons?domain=behance.net&sz=64" },
      { name: "Figma", url: "https://www.figma.com", description: "协作式界面设计工具，业界标准", favicon: "https://www.google.com/s2/favicons?domain=figma.com&sz=64" },
      { name: "Pinterest", url: "https://www.pinterest.com", description: "全球视觉灵感搜索与收藏平台", favicon: "https://www.google.com/s2/favicons?domain=pinterest.com&sz=64" },
      { name: "Unsplash", url: "https://unsplash.com", description: "高质量免费图片资源库", favicon: "https://www.google.com/s2/favicons?domain=unsplash.com&sz=64" },
    ],
  },
  {
    id: "productivity",
    name: "效率工具",
    icon: "⚡",
    sites: [
      { name: "Notion", url: "https://www.notion.so", description: "All-in-one 笔记与协作空间", favicon: "https://www.google.com/s2/favicons?domain=notion.so&sz=64" },
      { name: "Linear", url: "https://linear.app", description: "现代化项目管理工具，开发者首选", favicon: "https://www.google.com/s2/favicons?domain=linear.app&sz=64" },
      { name: "Excalidraw", url: "https://excalidraw.com", description: "手绘风格白板绘图工具", favicon: "https://www.google.com/s2/favicons?domain=excalidraw.com&sz=64" },
      { name: "Raycast", url: "https://www.raycast.com", description: "macOS 效率启动器，替代 Spotlight", favicon: "https://www.google.com/s2/favicons?domain=raycast.com&sz=64" },
      { name: "1Password", url: "https://1password.com", description: "安全密码管理器，跨平台同步", favicon: "https://www.google.com/s2/favicons?domain=1password.com&sz=64" },
    ],
  },
  {
    id: "learning",
    name: "学习平台",
    icon: "📚",
    sites: [
      { name: "Coursera", url: "https://www.coursera.org", description: "全球顶尖大学在线课程平台", favicon: "https://www.google.com/s2/favicons?domain=coursera.org&sz=64" },
      { name: "freeCodeCamp", url: "https://www.freecodecamp.org", description: "免费交互式编程学习平台", favicon: "https://www.google.com/s2/favicons?domain=freecodecamp.org&sz=64" },
      { name: "LeetCode", url: "https://leetcode.com", description: "算法与编程刷题平台", favicon: "https://www.google.com/s2/favicons?domain=leetcode.com&sz=64" },
      { name: "掘金", url: "https://juejin.cn", description: "中文技术社区，开发者分享与交流", favicon: "https://www.google.com/s2/favicons?domain=juejin.cn&sz=64" },
      { name: "少数派", url: "https://sspai.com", description: "高质量数字生活内容平台", favicon: "https://www.google.com/s2/favicons?domain=sspai.com&sz=64" },
    ],
  },
  {
    id: "media",
    name: "内容平台",
    icon: "📺",
    sites: [
      { name: "YouTube", url: "https://www.youtube.com", description: "全球最大视频分享平台", favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64" },
      { name: "哔哩哔哩", url: "https://www.bilibili.com", description: "中国领先的弹幕视频网站", favicon: "https://www.google.com/s2/favicons?domain=bilibili.com&sz=64" },
      { name: "Spotify", url: "https://open.spotify.com", description: "全球最大音乐流媒体平台", favicon: "https://www.google.com/s2/favicons?domain=spotify.com&sz=64" },
      { name: "Reddit", url: "https://www.reddit.com", description: "全球最大社区论坛与内容聚合平台", favicon: "https://www.google.com/s2/favicons?domain=reddit.com&sz=64" },
      { name: "Product Hunt", url: "https://www.producthunt.com", description: "新产品发现平台，科技新品首发地", favicon: "https://www.google.com/s2/favicons?domain=producthunt.com&sz=64" },
    ],
  },
]

// ==================== 热门网站排行数据 ====================

/** 通过 Hacker News API 获取热门技术网站 */
async function fetchHackerNewsHot(signal?: AbortSignal): Promise<HotSite[]> {
  try {
    const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", { signal })
    if (!res.ok) return []
    const ids = (await res.json()) as number[]
    const top = ids.slice(0, 15)

    const stories = await Promise.allSettled(
      top.map(async (id) => {
        const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal })
        return r.json()
      })
    )

    const results: HotSite[] = []
    let rank = 1

    for (const story of stories) {
      if (story.status !== "fulfilled") continue
      const s = story.value as { title?: string; url?: string; score?: number; type?: string }
      if (!s.url || !s.title) continue

      let domain: string
      try {
        domain = new URL(s.url).hostname
      } catch {
        continue
      }

      results.push({
        rank: rank++,
        name: s.title.length > 40 ? s.title.slice(0, 40) + "…" : s.title,
        url: s.url,
        description: `来源：${domain}`,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        heat: Math.min(100, Math.round((s.score ?? 0) / 5)),
        trend: (s.score ?? 0) > 200 ? "up" : "stable",
        category: "科技",
      })

      if (results.length >= 10) break
    }

    return results
  } catch {
    return []
  }
}

/** 内置综合热度排行（作为 fallback 和补充） */
function getBuiltinHotSites(): HotSite[] {
  return [
    { rank: 1, name: "ChatGPT", url: "https://chat.openai.com", description: "OpenAI 旗舰对话 AI", favicon: "https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64", heat: 98, trend: "up", category: "AI" },
    { rank: 2, name: "YouTube", url: "https://www.youtube.com", description: "全球最大视频平台", favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64", heat: 96, trend: "stable", category: "视频" },
    { rank: 3, name: "GitHub", url: "https://github.com", description: "全球最大代码托管平台", favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=64", heat: 94, trend: "up", category: "开发" },
    { rank: 4, name: "Google", url: "https://www.google.com", description: "全球最大搜索引擎", favicon: "https://www.google.com/s2/favicons?domain=google.com&sz=64", heat: 93, trend: "stable", category: "搜索" },
    { rank: 5, name: "Reddit", url: "https://www.reddit.com", description: "全球最大社区论坛", favicon: "https://www.google.com/s2/favicons?domain=reddit.com&sz=64", heat: 90, trend: "stable", category: "社区" },
    { rank: 6, name: "Twitter/X", url: "https://x.com", description: "全球社交与资讯平台", favicon: "https://www.google.com/s2/favicons?domain=x.com&sz=64", heat: 88, trend: "down", category: "社交" },
    { rank: 7, name: "Wikipedia", url: "https://www.wikipedia.org", description: "全球最大免费百科全书", favicon: "https://www.google.com/s2/favicons?domain=wikipedia.org&sz=64", heat: 86, trend: "stable", category: "知识" },
    { rank: 8, name: "Notion", url: "https://www.notion.so", description: "All-in-one 协作笔记空间", favicon: "https://www.google.com/s2/favicons?domain=notion.so&sz=64", heat: 83, trend: "up", category: "效率" },
    { rank: 9, name: "Figma", url: "https://www.figma.com", description: "协作式界面设计工具", favicon: "https://www.google.com/s2/favicons?domain=figma.com&sz=64", heat: 81, trend: "up", category: "设计" },
    { rank: 10, name: "Stack Overflow", url: "https://stackoverflow.com", description: "最大程序员问答社区", favicon: "https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=64", heat: 80, trend: "stable", category: "开发" },
  ]
}

/** AI 热度排行 */
function getBuiltinAiHotSites(): HotSite[] {
  return [
    { rank: 1, name: "ChatGPT", url: "https://chat.openai.com", description: "OpenAI 旗舰对话 AI，全球用户量最大", favicon: "https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64", heat: 99, trend: "up", category: "对话 AI" },
    { rank: 2, name: "Claude", url: "https://claude.ai", description: "Anthropic 出品，长文本与安全性领先", favicon: "https://www.google.com/s2/favicons?domain=claude.ai&sz=64", heat: 92, trend: "up", category: "对话 AI" },
    { rank: 3, name: "Gemini", url: "https://gemini.google.com", description: "Google 多模态 AI，深度整合搜索", favicon: "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64", heat: 88, trend: "up", category: "对话 AI" },
    { rank: 4, name: "Midjourney", url: "https://www.midjourney.com", description: "顶级 AI 绘画工具，艺术风格领先", favicon: "https://www.google.com/s2/favicons?domain=midjourney.com&sz=64", heat: 86, trend: "stable", category: "AI 绘画" },
    { rank: 5, name: "Perplexity", url: "https://www.perplexity.ai", description: "AI 搜索引擎，实时检索与总结", favicon: "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64", heat: 84, trend: "up", category: "AI 搜索" },
    { rank: 6, name: "元宝", url: "https://yuanbao.tencent.com", description: "腾讯 AI 助手，深度思考能力强", favicon: "https://www.google.com/s2/favicons?domain=yuanbao.tencent.com&sz=64", heat: 82, trend: "up", category: "对话 AI" },
    { rank: 7, name: "Cursor", url: "https://cursor.sh", description: "AI 驱动的代码编辑器", favicon: "https://www.google.com/s2/favicons?domain=cursor.sh&sz=64", heat: 80, trend: "up", category: "AI 编程" },
    { rank: 8, name: "Kimi", url: "https://kimi.moonshot.cn", description: "月之暗面出品，擅长长文本理解", favicon: "https://www.google.com/s2/favicons?domain=kimi.moonshot.cn&sz=64", heat: 78, trend: "stable", category: "对话 AI" },
    { rank: 9, name: "Suno", url: "https://suno.com", description: "AI 音乐创作平台，输入文字生成歌曲", favicon: "https://www.google.com/s2/favicons?domain=suno.com&sz=64", heat: 75, trend: "up", category: "AI 音乐" },
    { rank: 10, name: "Runway", url: "https://runwayml.com", description: "AI 视频编辑与生成平台", favicon: "https://www.google.com/s2/favicons?domain=runwayml.com&sz=64", heat: 73, trend: "up", category: "AI 视频" },
  ]
}

// ==================== Product Hunt 热门获取 ====================

/** 通过爬取 Product Hunt 获取热门产品（使用 CORS 代理） */
async function fetchProductHuntHot(signal?: AbortSignal): Promise<HotSite[]> {
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent("https://www.producthunt.com")}`
    const res = await fetch(proxyUrl, { signal })
    if (!res.ok) return []
    const html = await res.text()

    // 简单解析页面中的产品信息
    const results: HotSite[] = []
    const titleMatches = html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)
    let rank = 1

    for (const match of titleMatches) {
      if (rank > 5) break
      const name = match[1].trim()
      if (name.length < 2 || name.length > 60) continue

      results.push({
        rank,
        name,
        url: "https://www.producthunt.com",
        description: "Product Hunt 热门产品",
        favicon: "https://www.google.com/s2/favicons?domain=producthunt.com&sz=64",
        heat: Math.max(50, 100 - rank * 8),
        trend: "up",
        category: "新品",
      })
      rank++
    }

    return results
  } catch {
    return []
  }
}

// ==================== 主数据获取 ====================

/** 获取发现页完整数据（优先缓存，过期时网络刷新） */
export async function fetchExploreData(forceRefresh = false): Promise<ExploreData> {
  // 检查缓存
  if (!forceRefresh) {
    const cached = getCachedData()
    if (cached) return cached
  }

  // 并行获取各数据源
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  let hotSites = getBuiltinHotSites()
  const aiHotSites = getBuiltinAiHotSites()

  try {
    const [hnResults, phResults] = await Promise.allSettled([
      fetchHackerNewsHot(controller.signal),
      fetchProductHuntHot(controller.signal),
    ])

    clearTimeout(timeout)

    // 合并 HN 结果到热度排行
    const hnSites = hnResults.status === "fulfilled" ? hnResults.value : []
    const phSites = phResults.status === "fulfilled" ? phResults.value : []

    if (hnSites.length > 0 || phSites.length > 0) {
      // 将爬取的实时数据与内置数据混合
      const liveSites = [...hnSites, ...phSites]
      // 保留内置排行，但将实时数据附加
      const combined = [...hotSites]
      for (const site of liveSites) {
        if (!combined.find(s => s.url === site.url)) {
          combined.push({ ...site, rank: combined.length + 1 })
        }
      }
      hotSites = combined.slice(0, 10).map((s, i) => ({ ...s, rank: i + 1 }))
    }
  } catch {
    clearTimeout(timeout)
    // 网络失败时使用内置数据
  }

  const data: ExploreData = {
    categories: BUILTIN_CATEGORIES,
    hotSites,
    aiHotSites,
    lastUpdated: new Date().toISOString(),
  }

  // 缓存结果
  setCachedData(data)

  return data
}

/** 获取缓存的最后更新时间 */
export function getLastUpdateTime(): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as ExploreData
    return cached.lastUpdated
  } catch {
    return null
  }
}

/** 检查是否需要刷新（超过 4 小时） */
export function needsRefresh(): boolean {
  const cached = getCachedData()
  return !cached
}
