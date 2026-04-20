import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { BookmarkGroup } from "@/types"

const GROUPS_SNAPSHOT_KEY = "minitab_snapshot_groups"

/** 读取分组快照 */
function readGroupsSnapshot(): BookmarkGroup[] | null {
  try {
    const raw = localStorage.getItem(GROUPS_SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

/** 写入分组快照 */
function writeGroupsSnapshot(groups: BookmarkGroup[]) {
  try {
    localStorage.setItem(GROUPS_SNAPSHOT_KEY, JSON.stringify(groups))
  } catch {
    // 静默失败，快照仅为加速缓存
  }
}

export function useGroups() {
  const { dataProvider, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()

  // Phase1: 从快照初始化，有快照则直接 loading=false
  const [groups, setGroups] = useState<BookmarkGroup[]>(() => {
    return readGroupsSnapshot() ?? []
  })
  const [loading, setLoading] = useState(() => {
    return readGroupsSnapshot() === null
  })

  const fetchGroups = useCallback(async () => {
    // 如果有快照缓存，后台静默刷新不显示 loading
    if (!readGroupsSnapshot()) setLoading(true)
    try {
      const data = await dataProvider.getGroups()
      setGroups(data)
      writeGroupsSnapshot(data) // Phase2: 刷新快照
    } catch {
      showToast("error", "获取分组失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [dataProvider, showToast])

  useEffect(() => {
    // auth 还在加载时不发起请求，等 dataProvider 确定后再 fetch
    if (authLoading) return
    fetchGroups()
  }, [fetchGroups, authLoading])

  const addGroup = async (name: string) => {
    try {
      const newGroup = await dataProvider.createGroup(name)
      setGroups((prev) => {
        const next = [...prev, newGroup]
        writeGroupsSnapshot(next)
        return next
      })
      showToast("success", "分组创建成功")
      return newGroup
    } catch {
      showToast("error", "创建分组失败，请稍后重试")
    }
  }

  const updateGroup = async (id: string, name: string) => {
    try {
      const updated = await dataProvider.updateGroup(id, name)
      setGroups((prev) => {
        const next = prev.map((g) => (g.id === id ? updated : g))
        writeGroupsSnapshot(next)
        return next
      })
      showToast("success", "分组已更新")
      return updated
    } catch {
      showToast("error", "更新分组失败，请稍后重试")
    }
  }

  const deleteGroup = async (id: string) => {
    try {
      await dataProvider.deleteGroup(id)
      setGroups((prev) => {
        const next = prev.filter((g) => g.id !== id)
        writeGroupsSnapshot(next)
        return next
      })
      showToast("success", "分组已删除")
    } catch {
      showToast("error", "删除分组失败，请稍后重试")
    }
  }

  const reorderGroups = async (orderedIds: string[]) => {
    // 乐观更新 UI
    setGroups((prev) => {
      const map = new Map(prev.map((g) => [g.id, g]))
      const next = orderedIds
        .map((id, i) => {
          const g = map.get(id)
          return g ? { ...g, sort_order: i } : null
        })
        .filter(Boolean) as BookmarkGroup[]
      writeGroupsSnapshot(next)
      return next
    })
    try {
      await dataProvider.reorderGroups(orderedIds)
    } catch {
      showToast("error", "排序保存失败，请稍后重试")
      fetchGroups()
    }
  }

  return { groups, loading, fetchGroups, addGroup, updateGroup, deleteGroup, reorderGroups }
}
