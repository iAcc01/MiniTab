import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { Bookmark } from "@/types"

export function useBookmarks(groupId?: string) {
  const { dataProvider } = useAuth()
  const { showToast } = useToast()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [allBookmarks, setAllBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBookmarks = useCallback(async () => {
    setLoading(true)
    try {
      if (groupId) {
        const data = await dataProvider.getBookmarksByGroup(groupId)
        setBookmarks(data)
      }
      const all = await dataProvider.getAllBookmarks()
      setAllBookmarks(all)
    } catch {
      showToast("error", "获取书签失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [dataProvider, groupId, showToast])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  const addBookmark = async (data: Omit<Bookmark, "id" | "created_at" | "updated_at">) => {
    try {
      const newBookmark = await dataProvider.createBookmark(data)
      setAllBookmarks((prev) => [...prev, newBookmark])
      if (data.group_id === groupId) {
        setBookmarks((prev) => [...prev, newBookmark])
      }
      showToast("success", "书签添加成功")
      return newBookmark
    } catch {
      showToast("error", "添加书签失败，请稍后重试")
    }
  }

  const updateBookmark = async (id: string, data: Partial<Bookmark>) => {
    try {
      const updated = await dataProvider.updateBookmark(id, data)
      setAllBookmarks((prev) => prev.map((b) => (b.id === id ? updated : b)))
      setBookmarks((prev) => prev.map((b) => (b.id === id ? updated : b)))
      showToast("success", "书签已更新")
      return updated
    } catch {
      showToast("error", "更新书签失败，请稍后重试")
    }
  }

  const deleteBookmark = async (id: string) => {
    try {
      await dataProvider.deleteBookmark(id)
      setAllBookmarks((prev) => prev.filter((b) => b.id !== id))
      setBookmarks((prev) => prev.filter((b) => b.id !== id))
      showToast("success", "书签已删除")
    } catch {
      showToast("error", "删除书签失败，请稍后重试")
    }
  }

  const getBookmarksByGroup = (gId: string) => {
    return allBookmarks.filter((b) => b.group_id === gId)
  }

  return {
    bookmarks,
    allBookmarks,
    loading,
    fetchBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    getBookmarksByGroup,
  }
}

export function getFaviconUrl(url: string): string {
  const domain = new URL(url).hostname
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}
