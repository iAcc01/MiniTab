/**
 * Favicon 获取模块
 *
 * 策略（方案 1 + 方案 3 结合）：
 * 1. 优先通过 CORS 代理抓取目标站点 HTML，解析 <link rel="icon"> 等标签得到真实 favicon
 * 2. 若解析失败，回退到国内可访问的第三方 favicon 服务
 * 3. 渲染层在加载失败时再做一次回退（getFaviconFallbackUrl），最终兜底显示占位图标
 *
 * 注意：原 Google favicon 服务（www.google.com/s2/favicons）在中国大陆不稳定，
 * 这是新添加书签 logo 加载不出来的根因。
 */

// 内存缓存：domain -> favicon URL，避免重复请求
const faviconCache = new Map<string, string>()

/** 国内可访问的第三方 favicon 服务（作为统一回退） */
function thirdPartyFaviconUrl(domain: string): string {
  return `https://favicon.cccyun.cc/${domain}`
}

/**
 * 同步获取 favicon URL：仅返回第三方服务地址（或缓存中已解析过的真实地址）
 * 用于无法 await 的场景，例如外部搜索结果即时展示
 */
export function getFaviconUrlSync(url: string): string {
  try {
    const domain = new URL(url).hostname
    if (faviconCache.has(domain)) return faviconCache.get(domain)!
    return thirdPartyFaviconUrl(domain)
  } catch {
    return ""
  }
}

/**
 * 渲染层使用的回退 URL：当主 favicon 加载失败时切换到该地址
 */
export function getFaviconFallbackUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return thirdPartyFaviconUrl(domain)
  } catch {
    return ""
  }
}

/**
 * 异步获取 favicon URL（推荐）：
 * 优先解析 HTML 中的真实 favicon，失败回退到第三方服务
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

    const fallback = thirdPartyFaviconUrl(domain)
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
