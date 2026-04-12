import type { VersionInfo, UpdateCheckResult } from "@/types"

// ==================== 常量 ====================

const DISMISSED_VERSION_KEY = "minitab_dismissed_version"
const LAST_CHECK_KEY = "minitab_last_check_time"
const CACHED_UPDATE_KEY = "minitab_cached_update"
const UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/iAcc01/MiniTab/main/update-manifest.json"

/** GitHub Releases 下载页地址 */
export const GITHUB_RELEASES_URL = "https://github.com/iAcc01/MiniTab/releases/latest"

// TODO: 调试完成后恢复检查间隔限制（每 4 小时最多检查一次）
// const CHECK_INTERVAL = 4 * 60 * 60 * 1000
const CURRENT_VERSION_KEY = "minitab_current_version"

// ==================== 版本比较 ====================

/**
 * 语义化版本比较
 * 返回: 1 (a > b), -1 (a < b), 0 (a === b)
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number)
  const pb = b.split(".").map(Number)
  const len = Math.max(pa.length, pb.length)

  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? 0
    const vb = pb[i] ?? 0
    if (va > vb) return 1
    if (va < vb) return -1
  }
  return 0
}

// ==================== 获取当前版本 ====================

/** 获取当前扩展版本号 */
export function getCurrentVersion(): string {
  // Chrome 扩展环境
  if (typeof chrome !== "undefined" && chrome.runtime?.getManifest) {
    try {
      return chrome.runtime.getManifest().version
    } catch {
      // fallthrough
    }
  }
  // 非扩展环境：从 package.json 编译时注入的版本号
  return __APP_VERSION__ ?? "1.0.0"
}

// Vite 全局常量声明
declare const __APP_VERSION__: string | undefined

// ==================== 忽略版本管理 ====================

/** 获取用户已忽略的版本号 */
export function getDismissedVersion(): string | null {
  return localStorage.getItem(DISMISSED_VERSION_KEY)
}

/** 设置忽略的版本号 */
export function setDismissedVersion(version: string): void {
  localStorage.setItem(DISMISSED_VERSION_KEY, version)
}

// ==================== 缓存更新结果 ====================

/** 缓存检测到的更新信息（持久化到 localStorage） */
export function setCachedUpdate(result: UpdateCheckResult): void {
  if (result.hasUpdate && result.latestVersion) {
    localStorage.setItem(CACHED_UPDATE_KEY, JSON.stringify(result))
  } else {
    localStorage.removeItem(CACHED_UPDATE_KEY)
  }
}

/** 读取缓存的更新信息 */
export function getCachedUpdate(): UpdateCheckResult | null {
  try {
    const raw = localStorage.getItem(CACHED_UPDATE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as UpdateCheckResult
    // 验证缓存的版本是否仍然比当前版本新（用户可能已经手动更新了）
    if (cached.hasUpdate && cached.latestVersion) {
      const current = getCurrentVersion()
      if (compareVersions(cached.latestVersion.version, current) > 0) {
        return cached
      }
      // 已经是最新版本，清除缓存
      localStorage.removeItem(CACHED_UPDATE_KEY)
    }
    return null
  } catch {
    localStorage.removeItem(CACHED_UPDATE_KEY)
    return null
  }
}

/** 清除缓存的更新信息 */
export function clearCachedUpdate(): void {
  localStorage.removeItem(CACHED_UPDATE_KEY)
}

// ==================== 检查时机判断 ====================

/** 判断是否应该执行版本检查（当前为调试模式：每次打开都检查） */
export function shouldCheckForUpdate(): boolean {
  // TODO: 调试完成后恢复检查间隔限制
  // 版本变化时，清除缓存确保干净状态
  const currentVersion = getCurrentVersion()
  const storedVersion = localStorage.getItem(CURRENT_VERSION_KEY)
  if (storedVersion !== currentVersion) {
    localStorage.setItem(CURRENT_VERSION_KEY, currentVersion)
    localStorage.removeItem(LAST_CHECK_KEY)
    localStorage.removeItem(DISMISSED_VERSION_KEY)
    localStorage.removeItem(CACHED_UPDATE_KEY)
  }

  return true
}

// ==================== 远程版本检查 ====================

/** 从远程获取最新版本信息 */
async function fetchLatestVersion(signal?: AbortSignal): Promise<VersionInfo | null> {
  const controller = !signal ? new AbortController() : null
  const timeout = controller ? setTimeout(() => controller.abort(), 8000) : null

  try {
    const res = await fetch(UPDATE_MANIFEST_URL, {
      signal: signal ?? controller!.signal,
      cache: "no-store",
    })

    if (timeout) clearTimeout(timeout)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as VersionInfo
  } catch {
    if (timeout) clearTimeout(timeout)
    // 网络请求失败时静默返回 null，不误报更新
    return null
  }
}

// ==================== 主检查逻辑 ====================

/** 执行版本检查 */
export async function checkForUpdate(signal?: AbortSignal): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentVersion()

  try {
    const latest = await fetchLatestVersion(signal)

    // 更新最后检查时间
    localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString())

    // 网络请求失败，没有获取到远程版本信息
    if (!latest) {
      return {
        hasUpdate: false,
        currentVersion,
      }
    }

    const hasUpdate = compareVersions(latest.version, currentVersion) > 0

    return {
      hasUpdate,
      currentVersion,
      latestVersion: hasUpdate ? latest : undefined,
    }
  } catch (err) {
    return {
      hasUpdate: false,
      currentVersion,
      error: err instanceof Error ? err.message : "版本检查失败",
    }
  }
}
