import type { VersionInfo, UpdateCheckResult } from "@/types"

// ==================== 常量 ====================

const DISMISSED_VERSION_KEY = "minitab_dismissed_version"
const LAST_CHECK_KEY = "minitab_last_check_time"
const UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/iAcc01/MiniTab/main/update-manifest.json"

/** GitHub Releases 下载页地址 */
export const GITHUB_RELEASES_URL = "https://github.com/iAcc01/MiniTab/releases/latest"

// 每 4 小时最多检查一次
const CHECK_INTERVAL = 4 * 60 * 60 * 1000
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

// ==================== 检查时机判断 ====================

/** 判断是否应该执行版本检查（每天最多一次，版本变化时立即检查） */
export function shouldCheckForUpdate(): boolean {
  // 版本变化时（扩展刚安装或刚更新），清除上次检查时间，确保立即检查
  const currentVersion = getCurrentVersion()
  const storedVersion = localStorage.getItem(CURRENT_VERSION_KEY)
  if (storedVersion !== currentVersion) {
    localStorage.setItem(CURRENT_VERSION_KEY, currentVersion)
    localStorage.removeItem(LAST_CHECK_KEY)
    localStorage.removeItem(DISMISSED_VERSION_KEY)
    return true
  }

  const last = localStorage.getItem(LAST_CHECK_KEY)
  if (!last) return true
  return Date.now() - new Date(last).getTime() >= CHECK_INTERVAL
}

// ==================== 远程版本检查 ====================

/** 从远程获取最新版本信息 */
async function fetchLatestVersion(signal?: AbortSignal): Promise<VersionInfo | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(UPDATE_MANIFEST_URL, {
      signal: signal ?? controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeout)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as VersionInfo
  } catch {
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
