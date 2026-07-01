import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { Bookmark } from "@/types"
import { sessionCache } from "@/lib/sessionCache"

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
      sessionCache.setBookmarks(all) // Phase3: 写入 session 缓存，跨标签页共享
    } catch {
      showToast("error", "获取书签失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [dataProvider, groupId, showToast])

  // 挂载后立即从 chrome.storage.session 热更新（跨标签页共享，近零延迟）
  useEffect(() => {
    sessionCache.getBookmarks().then((cached) => {
      if (cached) setAllBookmarks(cached)
    })
  }, [])

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

// favicon 获取统一收口到 src/lib/fetchFavicon.ts
// 同步版本（getFaviconUrl）使用国内第三方服务，避免 Google favicon 在中国大陆不可用的问题
// 异步版本（fetchFaviconUrl）会优先解析目标站点 HTML 中的真实 favicon
export { getFaviconUrlSync as getFaviconUrl, fetchFaviconUrl } from "@/lib/fetchFavicon"
