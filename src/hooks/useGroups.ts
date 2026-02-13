import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { BookmarkGroup } from "@/types"

export function useGroups() {
  const { dataProvider } = useAuth()
  const { showToast } = useToast()
  const [groups, setGroups] = useState<BookmarkGroup[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const data = await dataProvider.getGroups()
      setGroups(data)
    } catch {
      showToast("error", "获取分组失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [dataProvider, showToast])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const addGroup = async (name: string) => {
    try {
      const newGroup = await dataProvider.createGroup(name)
      setGroups((prev) => [...prev, newGroup])
      showToast("success", "分组创建成功")
      return newGroup
    } catch {
      showToast("error", "创建分组失败，请稍后重试")
    }
  }

  const updateGroup = async (id: string, name: string) => {
    try {
      const updated = await dataProvider.updateGroup(id, name)
      setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)))
      showToast("success", "分组已更新")
      return updated
    } catch {
      showToast("error", "更新分组失败，请稍后重试")
    }
  }

  const deleteGroup = async (id: string) => {
    try {
      await dataProvider.deleteGroup(id)
      setGroups((prev) => prev.filter((g) => g.id !== id))
      showToast("success", "分组已删除")
    } catch {
      showToast("error", "删除分组失败，请稍后重试")
    }
  }

  const reorderGroups = async (orderedIds: string[]) => {
    // 乐观更新 UI
    setGroups((prev) => {
      const map = new Map(prev.map((g) => [g.id, g]))
      return orderedIds
        .map((id, i) => {
          const g = map.get(id)
          return g ? { ...g, sort_order: i } : null
        })
        .filter(Boolean) as BookmarkGroup[]
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
