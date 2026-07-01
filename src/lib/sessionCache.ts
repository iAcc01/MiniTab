import { BookmarkGroup, Bookmark } from "@/types"

const SESSION_GROUPS_KEY = "minitab_session_groups"
const SESSION_BOOKMARKS_KEY = "minitab_session_bookmarks"
const SESSION_AUTH_KEY = "minitab_session_auth"

// chrome.storage.session 是 MV3 的内存级存储，零 I/O 延迟，跨标签页共享
// 浏览器关闭后自动清除，无需手动管理生命周期
function storageAvailable(): boolean {
  return typeof chrome !== "undefined" && !!chrome.storage?.session
}

export const sessionCache = {
  // --- Groups ---
  async getGroups(): Promise<BookmarkGroup[] | null> {
    if (!storageAvailable()) return null
    try {
      const result = await chrome.storage.session.get(SESSION_GROUPS_KEY)
      const data = result[SESSION_GROUPS_KEY]
      return Array.isArray(data) && data.length > 0 ? (data as BookmarkGroup[]) : null
    } catch {
      return null
    }
  },

  async setGroups(groups: BookmarkGroup[]): Promise<void> {
    if (!storageAvailable()) return
    try {
      await chrome.storage.session.set({ [SESSION_GROUPS_KEY]: groups })
    } catch {
      // 静默失败，session 缓存为优化用途
    }
  },

  // --- Bookmarks ---
  async getBookmarks(): Promise<Bookmark[] | null> {
    if (!storageAvailable()) return null
    try {
      const result = await chrome.storage.session.get(SESSION_BOOKMARKS_KEY)
      const data = result[SESSION_BOOKMARKS_KEY]
      return Array.isArray(data) && data.length > 0 ? (data as Bookmark[]) : null
    } catch {
      return null
    }
  },

  async setBookmarks(bookmarks: Bookmark[]): Promise<void> {
    if (!storageAvailable()) return
    try {
      await chrome.storage.session.set({ [SESSION_BOOKMARKS_KEY]: bookmarks })
    } catch {
      // 静默失败
    }
  },

  // --- Auth ---
  async getAuthUserId(): Promise<string | null> {
    if (!storageAvailable()) return null
    try {
      const result = await chrome.storage.session.get(SESSION_AUTH_KEY)
      const data = result[SESSION_AUTH_KEY] as { userId?: string } | undefined
      return data?.userId ?? null
    } catch {
      return null
    }
  },

  async setAuthUserId(userId: string): Promise<void> {
    if (!storageAvailable()) return
    try {
      await chrome.storage.session.set({ [SESSION_AUTH_KEY]: { userId } })
    } catch {
      // 静默失败
    }
  },

  async clearAll(): Promise<void> {
    if (!storageAvailable()) return
    try {
      await chrome.storage.session.remove([
        SESSION_GROUPS_KEY,
        SESSION_BOOKMARKS_KEY,
        SESSION_AUTH_KEY,
      ])
    } catch {
      // 静默失败
    }
  },
}
