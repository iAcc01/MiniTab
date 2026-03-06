export interface ExternalSearchResult {
  title: string
  url: string
  description: string
  favicon_url: string
}

/**
 * 从用户输入解析出域名列表
 */
function parseDomainsFromInput(input: string): string[] {
  let cleaned = input.trim().toLowerCase()

  // 完整 URL → 提取域名
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    try {
      return [new URL(cleaned).hostname]
    } catch {
      // fallthrough
    }
  }

  // 去掉可能的协议前缀和路径
  cleaned = cleaned.replace(/^(https?:\/\/)?/, "").replace(/\/.*$/, "")

  // 已含 . → 用户输入了域名
  if (cleaned.includes(".")) {
    return [cleaned]
  }

  // 关键词 → 猜测常见后缀
  return [
    `${cleaned}.com`,
    `${cleaned}.cn`,
    `${cleaned}.net`,
    `${cleaned}.org`,
    `${cleaned}.io`,
    `${cleaned}.dev`,
    `${cleaned}.co`,
    `${cleaned}.app`,
    `${cleaned}.cc`,
  ]
}

/**
 * 通过加载 favicon 图片检测域名是否存在
 * <img> 标签不受 CORS 限制，这是在纯前端唯一可靠的方式
 */
function checkDomainViaFavicon(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const timer = setTimeout(() => {
      img.src = ""
      resolve(false)
    }, 4000)

    img.onload = () => {
      clearTimeout(timer)
      // Google favicon 对不存在的域名也会返回默认图标(大小很小)
      // 但只要能加载就认为通过，后续会用代理进一步验证
      resolve(true)
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(false)
    }

    // 使用 Google favicon 服务
    img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  })
}

/**
 * 用 CORS 代理获取网站标题和描述
 */
async function fetchSiteInfo(
  domain: string,
  signal: AbortSignal
): Promise<{ title: string; description: string }> {
  const proxies = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ]

  const targetUrl = `https://${domain}`

  for (const makeProxy of proxies) {
    try {
      const res = await fetch(makeProxy(targetUrl), { signal })
      if (!res.ok) continue

      const html = await res.text()
      if (!html || html.length < 50) continue

      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      const descMatch =
        html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) ||
        html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i) ||
        html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["']/i)

      const title = titleMatch
        ? decodeHTMLEntities(titleMatch[1].replace(/\n/g, " ").trim()).substring(0, 100)
        : domain

      const description = descMatch
        ? decodeHTMLEntities(descMatch[1].replace(/\n/g, " ").trim()).substring(0, 200)
        : ""

      // 标题不为空才认为有效
      if (title && title !== domain) {
        return { title, description }
      }
      // 有 description 也算有效
      if (description) {
        return { title: domain, description }
      }
    } catch {
      continue
    }
  }

  return { title: domain, description: "" }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/\s+/g, " ")
}

/**
 * 主入口：根据用户输入搜索网站
 *
 * 策略：
 * 1. 解析输入为域名列表（完整URL直接提取，关键词猜测后缀）
 * 2. 用 img favicon 检测域名是否可达（不受CORS限制）
 * 3. 对存在的域名用代理获取标题和描述
 */
export async function searchExternal(
  query: string
): Promise<ExternalSearchResult[]> {
  if (!query.trim()) return []

  const domains = parseDomainsFromInput(query)

  // 如果用户输入的是完整域名（含.），直接作为结果，不需要验证
  // 因为用户明确知道这个网址
  const isDirectDomain =
    query.trim().includes(".") || query.trim().startsWith("http")

  if (isDirectDomain) {
    const domain = domains[0]
    if (!domain) return []

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    try {
      const info = await fetchSiteInfo(domain, controller.signal)
      clearTimeout(timeout)

      return [
        {
          title: info.title || domain,
          url: `https://${domain}`,
          description: info.description,
          favicon_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        },
      ]
    } catch {
      clearTimeout(timeout)
      // 即使获取信息失败，也返回基本结果
      return [
        {
          title: domain,
          url: `https://${domain}`,
          description: "",
          favicon_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        },
      ]
    }
  }

  // 关键词输入：并行检测多个可能的域名
  const checkResults = await Promise.allSettled(
    domains.map((d) => checkDomainViaFavicon(d).then((ok) => ({ domain: d, ok })))
  )

  const validDomains = checkResults
    .filter((r) => r.status === "fulfilled" && r.value.ok)
    .map(
      (r) =>
        (r as PromiseFulfilledResult<{ domain: string; ok: boolean }>).value
          .domain
    )

  if (validDomains.length === 0) {
    // favicon 检测可能不准确（Google 对所有域名都返回图片）
    // 回退：对最常见的 .com 直接展示
    const primary = domains[0]
    if (primary) {
      return [
        {
          title: primary,
          url: `https://${primary}`,
          description: "",
          favicon_url: `https://www.google.com/s2/favicons?domain=${primary}&sz=64`,
        },
      ]
    }
    return []
  }

  // 限制并行抓取数量
  const toFetch = validDomains.slice(0, 5)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  const infos = await Promise.allSettled(
    toFetch.map((d) =>
      fetchSiteInfo(d, controller.signal).then((info) => ({
        domain: d,
        ...info,
      }))
    )
  )

  clearTimeout(timeout)

  const results: ExternalSearchResult[] = []
  const added = new Set<string>()

  // 优先展示有标题信息的
  for (const info of infos) {
    if (info.status === "fulfilled") {
      const { domain, title, description } = info.value
      added.add(domain)
      results.push({
        title: title || domain,
        url: `https://${domain}`,
        description,
        favicon_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      })
    }
  }

  // 补充验证通过但抓取失败的
  for (const domain of toFetch) {
    if (!added.has(domain)) {
      results.push({
        title: domain,
        url: `https://${domain}`,
        description: "",
        favicon_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      })
    }
  }

  // 把有实际标题（非域名）的排前面
  results.sort((a, b) => {
    const aHasTitle = a.title !== a.url.replace("https://", "") ? 1 : 0
    const bHasTitle = b.title !== b.url.replace("https://", "") ? 1 : 0
    return bHasTitle - aHasTitle
  })

  return results
}
