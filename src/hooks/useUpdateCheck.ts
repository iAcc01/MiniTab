import { useState, useEffect, useCallback, useRef } from "react"
import type { UpdateCheckResult } from "@/types"
import {
  checkForUpdate,
  shouldCheckForUpdate,
  getCurrentVersion,
  getDismissedVersion,
  setDismissedVersion,
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

export function useUpdateCheck(): UseUpdateCheckReturn {
  const [result, setResult] = useState<UpdateCheckResult | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const checkedRef = useRef(false)

  const currentVersion = getCurrentVersion()

  // 初始化：启动时自动检查一次（满足时间间隔时）
  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true

    if (!shouldCheckForUpdate()) return

    const controller = new AbortController()
    abortRef.current = controller

    checkForUpdate(controller.signal).then((res) => {
      if (!controller.signal.aborted) {
        setResult(res)
      }
    })

    return () => {
      controller.abort()
    }
  }, [])

  // 忽略本次更新
  const dismissUpdate = useCallback(() => {
    if (result?.latestVersion) {
      setDismissedVersion(result.latestVersion.version)
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
