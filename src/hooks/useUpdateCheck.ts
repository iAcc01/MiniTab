import { useState, useEffect, useCallback, useRef } from "react"
import type { UpdateCheckResult } from "@/types"
import {
  checkForUpdate,
  shouldCheckForUpdate,
  getCurrentVersion,
  getDismissedVersion,
  setDismissedVersion,
  getCachedUpdate,
  setCachedUpdate,
  clearCachedUpdate,
} from "@/lib/updateService"

interface UseUpdateCheckReturn {
  /** 检查结果 */
  result: UpdateCheckResult | null
  /** 当前版本 */
  currentVersion: string
  /** 是否显示更新提示 */
  shouldShowNotification: boolean
  /** 忽略本次更新 */
  dismissUpdate: () => void
}

/**
 * @param ready 外部信号：true 表示页面内容已就绪，可以开始检查更新（默认 true）
 */
export function useUpdateCheck(ready: boolean = true): UseUpdateCheckReturn {
  // 初始化时先从 localStorage 读取缓存的更新结果，实现"常驻"
  const [result, setResult] = useState<UpdateCheckResult | null>(() => getCachedUpdate())
  const abortRef = useRef<AbortController | null>(null)
  const checkedRef = useRef(false)

  const currentVersion = getCurrentVersion()

  // Phase3: 等 ready=true 后，利用空闲时段执行更新检查
  useEffect(() => {
    if (!ready) return
    if (checkedRef.current) return
    checkedRef.current = true

    if (!shouldCheckForUpdate()) return

    const startCheck = () => {
      const controller = new AbortController()
      abortRef.current = controller

      checkForUpdate(controller.signal).then((res) => {
        if (!controller.signal.aborted) {
          setResult(res)
          // 持久化检查结果到 localStorage
          setCachedUpdate(res)
        }
      })
    }

    // 优先使用 requestIdleCallback 在浏览器空闲时执行，降级用 setTimeout
    if (typeof requestIdleCallback === "function") {
      const idleId = requestIdleCallback(startCheck, { timeout: 3000 })
      return () => {
        cancelIdleCallback(idleId)
        abortRef.current?.abort()
      }
    } else {
      const timerId = setTimeout(startCheck, 1500)
      return () => {
        clearTimeout(timerId)
        abortRef.current?.abort()
      }
    }
  }, [ready])

  // 忽略本次更新
  const dismissUpdate = useCallback(() => {
    if (result?.latestVersion) {
      setDismissedVersion(result.latestVersion.version)
      clearCachedUpdate()
      setResult(null)
    }
  }, [result])

  // 计算是否应该显示通知
  const shouldShowNotification = (() => {
    if (!result?.hasUpdate || !result.latestVersion) return false
    // 用户已忽略此版本
    if (getDismissedVersion() === result.latestVersion.version) return false
    return true
  })()

  return {
    result,
    currentVersion,
    shouldShowNotification,
    dismissUpdate,
  }
}
