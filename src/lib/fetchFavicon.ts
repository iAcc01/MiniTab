/**
 * Favicon 获取模块
 *
 * 策略：
 * 1. 优先通过 CORS 代理抓取目标站点 HTML，解析 <link rel="icon"> 等标签得到真实 favicon
 * 2. 解析失败 → 直接用 https://<domain>/favicon.ico（浏览器从用户机器请求，
 *    内网网站只要用户处于登录态就能拿到真实图标）
 * 3. 渲染层在加载失败时再做多级 fallback：原始 url → /favicon.ico → favicon.vip
 *
 * 历史问题：
 * - Google favicon (www.google.com/s2/favicons)：在中国大陆不稳定
 * - favicon.cccyun.cc：已返回 403，不可用
 * - favicon.vip：对所有域名（包括内网/不存在的域名）都返回 HTTP 200 但内容是默认占位图，
 *   会"假成功"导致 fallback 链不触发，因此只能放在最后做兜底，不能作为主源/嗅探源
 */

// 内存缓存：domain -> favicon URL，避免重复请求
const faviconCache = new Map<string, string>()

/**
 * Favicon 备源列表（按优先级排序，用于多级 fallback）
 *
 * 顺序很重要：直连 /favicon.ico 必须在 favicon.vip 之前，
 * 否则对内网网站会一直显示 favicon.vip 的默认地球占位图。
 */
const FAVICON_SERVICES: Array<(domain: string) => string> = [
  // 主源：直接访问网站根目录（浏览器从用户本机发起，内网/外网都适用）
  (domain) => `https://${domain}/favicon.ico`,
  // 兜底：第三方服务（即使原站不可达也会返回占位图，不至于裂图）
  (domain) => `https://www.favicon.vip/get.php?url=${domain}`,
]

/** 主源（用于异步抓取失败后写库的兜底地址） */
function defaultFaviconUrl(domain: string): string {
  return FAVICON_SERVICES[0](domain)
}

/**
 * 同步获取 favicon URL：用于无法 await 的场景（如外部搜索结果即时展示）
 * 返回直连 /favicon.ico；若浏览器加载失败，渲染层会自动走 fallback 链
 */
export function getFaviconUrlSync(url: string): string {
  try {
    const domain = new URL(url).hostname
    if (faviconCache.has(domain)) return faviconCache.get(domain)!
    return defaultFaviconUrl(domain)
  } catch {
    return ""
  }
}

/**
 * 渲染层使用的回退 URL（兼容老调用方）
 * 等价于 getFaviconFallbackUrls(url)[0]
 */
export function getFaviconFallbackUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return defaultFaviconUrl(domain)
  } catch {
    return ""
  }
}

/**
 * 获取备用 favicon URL 列表（用于渲染层逐级 fallback）
 * 当主 favicon_url 加载失败时，按顺序依次尝试这些备源
 */
export function getFaviconFallbackUrls(url: string): string[] {
  try {
    const domain = new URL(url).hostname
    return FAVICON_SERVICES.map((make) => make(domain))
  } catch {
    return []
  }
}

/**
 * 已知会"假成功"的失效/占位 favicon 服务（按子串匹配）
 *
 * 这些第三方服务对所有域名都返回 HTTP 200，但实际是默认占位图，
 * 浏览器加载成功后不会触发 fallback。需要在渲染层主动跳过它们，
 * 直接走多级 fallback 链拿到真实图标。
 *
 * 注意：仅用于渲染层判定，不修改用户已存的 favicon_url 字段，
 * 完全不影响数据库/localStorage 中的存量数据。
 */
const STALE_FAVICON_HOSTS = [
  "favicon.cccyun.cc",     // 已 403，但用户老数据里可能存有
  "www.favicon.vip",       // 对所有域名返回占位地球图
  "favicon.vip",
  "www.google.com/s2/favicons", // 国内不稳定
]

/**
 * 判断一个 favicon_url 是否属于已知的失效/占位服务
 * 是的话渲染层应该跳过它，直接走 fallback 链
 */
export function isStaleFaviconUrl(faviconUrl: string | null | undefined): boolean {
  if (!faviconUrl) return false
  return STALE_FAVICON_HOSTS.some((host) => faviconUrl.includes(host))
}

/**
 * 异步获取 favicon URL（推荐，用于添加书签时）：
 * 1. 通过 CORS 代理解析 HTML 拿到 <link rel="icon"> 中的真实地址
 * 2. 解析失败 → 用 https://<domain>/favicon.ico 作为兜底（不直接用 favicon.vip）
 *    这样后续渲染时浏览器会从用户本机直连请求，对内网网站友好
 */
export async function fetchFaviconUrl(url: string): Promise<string> {
  try {
    const domain = new URL(url).hostname

    if (faviconCache.has(domain)) return faviconCache.get(domain)!

    const realFavicon = await extractFaviconFromHtml(url, domain)
    if (realFavicon) {
      faviconCache.set(domain, realFavicon)
      return realFavicon
    }

    const fallback = defaultFaviconUrl(domain)
    faviconCache.set(domain, fallback)
    return fallback
  } catch {
    return ""
  }
}

/**
 * 通过 CORS 代理抓取网页 HTML，解析其中的 favicon 声明
 */
async function extractFaviconFromHtml(
  url: string,
  domain: string
): Promise<string | null> {
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ]

  const targetUrl = url.startsWith("http") ? url : `https://${domain}`

  for (const makeProxy of proxies) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(makeProxy(targetUrl), { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) continue

      const html = await res.text()
      if (!html || html.length < 50) continue

      const faviconUrl = parseFaviconFromHtml(html, domain)
      if (faviconUrl) return faviconUrl
    } catch {
      continue
    }
  }

  return null
}

/**
 * 从 HTML 字符串中按优先级解析 favicon URL
 */
function parseFaviconFromHtml(html: string, domain: string): string | null {
  const baseUrl = `https://${domain}`

  // 同时收集所有 <link rel="..."> 中包含 icon 的标签，按优先级排序
  const linkRegex = /<link\b[^>]*>/gi
  const candidates: { rel: string; href: string; sizes: string }[] = []

  const matches = html.match(linkRegex)
  if (matches) {
    for (const tag of matches) {
      const rel = matchAttr(tag, "rel")?.toLowerCase() || ""
      if (!rel.includes("icon")) continue
      const href = matchAttr(tag, "href")
      if (!href) continue
      if (href.startsWith("data:")) continue // 跳过 data URI
      const sizes = matchAttr(tag, "sizes") || ""
      candidates.push({ rel, href, sizes })
    }
  }

  if (candidates.length === 0) return null

  // 优先级：apple-touch-icon（高清） > 普通 icon > shortcut icon
  // sizes 越大越优先
  candidates.sort((a, b) => {
    const score = (c: typeof a) => {
      let s = 0
      if (c.rel.includes("apple-touch-icon")) s += 100
      else if (c.rel === "icon") s += 50
      else s += 10
      const sizeNum = parseInt(c.sizes.split("x")[0]) || 0
      s += Math.min(sizeNum, 256) / 4
      return s
    }
    return score(b) - score(a)
  })

  return resolveUrl(candidates[0].href.trim(), baseUrl)
}

/** 提取标签的属性值 */
function matchAttr(tag: string, attr: string): string | null {
  const re = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i")
  const m = tag.match(re)
  return m ? m[1] : null
}

/** 将相对路径转为绝对路径 */
function resolveUrl(href: string, baseUrl: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href
  if (href.startsWith("//")) return `https:${href}`
  if (href.startsWith("/")) return `${baseUrl}${href}`
  return `${baseUrl}/${href}`
}
