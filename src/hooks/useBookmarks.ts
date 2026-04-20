import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { Bookmark } from "@/types"

const BOOKMARKS_SNAPSHOT_KEY = "minitab_snapshot_bookmarks"

/** 读取书签快照 */
function readBookmarksSnapshot(): Bookmark[] | null {
  try {
    const raw = localStorage.getItem(BOOKMARKS_SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

/** 写入书签快照 */
function writeBookmarksSnapshot(bookmarks: Bookmark[]) {
  try {
    localStorage.setItem(BOOKMARKS_SNAPSHOT_KEY, JSON.stringify(bookmarks))
  } catch {
    // 静默失败，快照仅为加速缓存
  }
}

export function useBookmarks(groupId?: string) {
  const { dataProvider, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  // Phase1: 从快照初始化 allBookmarks，有快照则 loading=false
  const [allBookmarks, setAllBookmarks] = useState<Bookmark[]>(() => {
    return readBookmarksSnapshot() ?? []
  })
  const [loading, setLoading] = useState(() => {
    return readBookmarksSnapshot() === null
  })

  const fetchBookmarks = useCallback(async () => {
    // 如果有快照缓存，后台静默刷新不显示 loading
    if (!readBookmarksSnapshot()) setLoading(true)
    try {
      if (groupId) {
        const data = await dataProvider.getBookmarksByGroup(groupId)
        setBookmarks(data)
      }
      const all = await dataProvider.getAllBookmarks()
      setAllBookmarks(all)
      writeBookmarksSnapshot(all) // Phase2: 刷新快照
    } catch {
      showToast("error", "获取书签失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [dataProvider, groupId, showToast])

  useEffect(() => {
    // auth 还在加载时不发起请求，等 dataProvider 确定后再 fetch
    if (authLoading) return
    fetchBookmarks()
  }, [fetchBookmarks, authLoading])

  const addBookmark = async (data: Omit<Bookmark, "id" | "created_at" | "updated_at">) => {
    try {
      const newBookmark = await dataProvider.createBookmark(data)
      setAllBookmarks((prev) => {
        const next = [...prev, newBookmark]
        writeBookmarksSnapshot(next)
        return next
      })
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
      setAllBookmarks((prev) => {
        const next = prev.map((b) => (b.id === id ? updated : b))
        writeBookmarksSnapshot(next)
        return next
      })
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
      setAllBookmarks((prev) => {
        const next = prev.filter((b) => b.id !== id)
        writeBookmarksSnapshot(next)
        return next
      })
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
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return ""
  }
}
