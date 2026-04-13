import { useState, useEffect, useCallback, useRef } from "react"
import { fetchExploreData, needsRefresh, type ExploreData } from "@/lib/exploreService"

const REFRESH_INTERVAL = 4 * 60 * 60 * 1000 // 4 小时

export function useExploreData() {
  const [data, setData] = useState<ExploreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadData = useCallback(async (force = false) => {
    if (force) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const result = await fetchExploreData(force)
      setData(result)
    } catch (err) {
      console.error("Failed to load explore data:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    loadData(needsRefresh())
  }, [loadData])

  // 定时刷新（每 4 小时）
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadData(true)
    }, REFRESH_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [loadData])

  const refresh = useCallback(() => loadData(true), [loadData])

  return {
    data,
    loading,
    refreshing,
    refresh,
  }
}
