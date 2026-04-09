import type { VersionInfo, UpdateCheckResult } from "@/types"

// ==================== 常量 ====================

const DISMISSED_VERSION_KEY = "minitab_dismissed_version"
const LAST_CHECK_KEY = "minitab_last_check_time"
const UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/user/minitab-v2/main/update-manifest.json"

// 每天最多检查一次
const CHECK_INTERVAL = 24 * 60 * 60 * 1000

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

/** 判断是否应该执行版本检查（每天最多一次） */
export function shouldCheckForUpdate(): boolean {
  const last = localStorage.getItem(LAST_CHECK_KEY)
  if (!last) return true
  return Date.now() - new Date(last).getTime() >= CHECK_INTERVAL
}

// ==================== 远程版本检查 ====================

/**
 * 模拟远程版本数据（生产中替换为真实 API）
 */
function getMockLatestVersion(): VersionInfo {
  return {
    version: "1.1.0",
    releaseDate: new Date().toISOString().split("T")[0],
    changelog: [
      { type: "feature", description: "新增插件更新通知系统" },
      { type: "feature", description: "新增更新日志查看功能" },
      { type: "improvement", description: "优化书签搜索性能，结果响应更快" },
      { type: "improvement", description: "改进暗色模式下的视觉体验" },
      { type: "fix", description: "修复导入书签时偶尔丢失图标的问题" },
      { type: "fix", description: "修复侧边栏在窄屏下的布局异常" },
    ],
  }
}

/** 从远程获取最新版本信息 */
async function fetchLatestVersion(signal?: AbortSignal): Promise<VersionInfo> {
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
    // 网络请求失败时使用 mock 数据（开发/测试用）
    return getMockLatestVersion()
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
