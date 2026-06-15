import { useEffect, useMemo, useRef, useState } from "react"
import { getFaviconFallbackUrls, isStaleFaviconUrl } from "@/lib/fetchFavicon"

/**
 * Favicon 加载状态：
 * - "loading": 正在尝试加载某个 URL
 * - "loaded":  某个候选 URL 加载成功，可正常显示
 * - "failed":  所有候选 URL 全部失败 / 超时，调用方应展示本地占位
 */
type FaviconStatus = "loading" | "loaded" | "failed"

interface UseFaviconLoaderResult {
  /** 最终用于 <img src> 的地址；当 status === "failed" 时为 null */
  url: string | null
  status: FaviconStatus
  /** <img onError> 时调用，触发下一个 fallback */
  onImgError: () => void
}

/**
 * 内网/外网图标加载默认超时：5 秒
 *
 * 内网域名（如 *.woa.com、*.oa.com）在公网或办公网外加载时，
 * 浏览器会卡在 TCP/TLS 建连阶段较长时间不报错，
 * 用 Image() 预加载 + setTimeout 强制兜底，保证 UI 不卡顿。
 */
const FAVICON_LOAD_TIMEOUT_MS = 5000

/**
 * 全局并发限制：最多同时加载 6 个 favicon
 *
 * 浏览器对同一域名的并发连接限制约为 6，加上不同域名的 favicon
 * 可能指向不同 CDN/服务器，限制总并发 6 可避免大量书签时
 * 浏览器连接池耗尽导致页面其他资源加载变慢。
 */
const MAX_CONCURRENT_LOADS = 6

// ---- 全局并发队列 ----
interface PendingTask {
  src: string
  timeoutMs: number
  resolve: (ok: boolean) => void
}

let activeCount = 0
const pendingQueue: PendingTask[] = []

function enqueue(task: PendingTask) {
  pendingQueue.push(task)
  drain()
}

function drain() {
  while (activeCount < MAX_CONCURRENT_LOADS && pendingQueue.length > 0) {
    const task = pendingQueue.shift()!
    activeCount++
    loadOne(task.src, task.timeoutMs).then((ok) => {
      task.resolve(ok)
      activeCount--
      drain()
    })
  }
}

function loadOne(src: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    let settled = false

    const timer = window.setTimeout(() => {
      if (settled) return
      settled = true
      img.src = ""
      resolve(false)
    }, timeoutMs)

    const cleanup = () => {
      window.clearTimeout(timer)
      img.onload = null
      img.onerror = null
    }

    img.onload = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve(img.naturalWidth > 0 && img.naturalHeight > 0)
    }
    img.onerror = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve(false)
    }

    img.src = src
  })
}

/**
 * 异步预加载一个图片 URL，带超时机制，走全局并发队列。
 */
function loadImageWithTimeout(
  src: string,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(false)
      return
    }

    const onAbort = () => {
      // 取消已在队列中的任务：从队列中移除并 resolve(false)
      const idx = pendingQueue.findIndex((t) => t.src === src)
      if (idx >= 0) {
        pendingQueue.splice(idx, 1)[0].resolve(false)
      }
    }
    signal?.addEventListener("abort", onAbort, { once: true })

    enqueue({
      src,
      timeoutMs,
      resolve: (ok) => {
        signal?.removeEventListener("abort", onAbort)
        resolve(ok)
      },
    })
  })
}

/**
 * 统一的 favicon 加载 hook，处理：
 * 1. 主 URL 失败 → 自动切换到 fallback URL 链
 * 2. 内网图标超时（防止 UI 长时间空白）
 * 3. 跨域 / 网络错误优雅降级
 * 4. 已知"假成功"占位服务（favicon.vip 等）跳过
 *
 * @param primaryUrl bookmark.favicon_url（用户保存的原始图标地址）
 * @param siteUrl    bookmark.url（用于推导 fallback 链）
 */
export function useFaviconLoader(
  primaryUrl: string | null | undefined,
  siteUrl: string
): UseFaviconLoaderResult {
  const fallbackUrls = useMemo(
    () => (siteUrl ? getFaviconFallbackUrls(siteUrl) : []),
    [siteUrl]
  )

  // 老数据兼容：若 primaryUrl 命中已知假成功服务，直接跳到 fallback 链
  const skipStale = useMemo(() => isStaleFaviconUrl(primaryUrl), [primaryUrl])

  // 候选链：[primaryUrl, ...fallbackUrls]，跳过空值与失效服务
  const candidates = useMemo(() => {
    const list: string[] = []
    if (primaryUrl && !skipStale) list.push(primaryUrl)
    for (const u of fallbackUrls) {
      if (u && !list.includes(u)) list.push(u)
    }
    return list
  }, [primaryUrl, fallbackUrls, skipStale])

  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<FaviconStatus>(
    candidates.length > 0 ? "loading" : "failed"
  )

  // 用 ref 跟踪最新候选链，避免 effect 闭包旧值
  const abortRef = useRef<AbortController | null>(null)

  // bookmark / url 变化时重置
  useEffect(() => {
    setIndex(0)
    setStatus(candidates.length > 0 ? "loading" : "failed")
  }, [candidates])

  // 预加载当前候选 URL（带超时），决定是否进下一个
  useEffect(() => {
    if (status !== "loading") return
    if (index >= candidates.length) {
      setStatus("failed")
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const currentUrl = candidates[index]
    let cancelled = false

    loadImageWithTimeout(currentUrl, FAVICON_LOAD_TIMEOUT_MS, controller.signal)
      .then((ok) => {
        if (cancelled || controller.signal.aborted) return
        if (ok) {
          setStatus("loaded")
        } else if (index + 1 < candidates.length) {
          setIndex(index + 1)
        } else {
          setStatus("failed")
        }
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [index, status, candidates])

  // <img onError>：原生失败 → 进入下一个候选
  const onImgError = () => {
    if (index + 1 < candidates.length) {
      setIndex(index + 1)
      setStatus("loading")
    } else {
      setStatus("failed")
    }
  }

  const url = status === "loaded" ? candidates[index] ?? null : null

  return { url, status, onImgError }
}
