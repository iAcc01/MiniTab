const cache = new Map<string, string>()

export async function fetchSiteDescription(url: string): Promise<string> {
  const hostname = getHostname(url)
  if (cache.has(hostname)) return cache.get(hostname)!

  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(proxyUrl, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) throw new Error("fetch failed")

    const html = await res.text()
    const desc = extractDescription(html)

    if (desc) {
      cache.set(hostname, desc)
      return desc
    }
  } catch {
    // silently fail
  }

  cache.set(hostname, "")
  return ""
}

function extractDescription(html: string): string {
  const metaPatterns = [
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i,
  ]

  for (const pattern of metaPatterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      const desc = match[1].trim()
      if (desc.length > 0 && desc.length < 200) return desc
    }
  }
  return ""
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
