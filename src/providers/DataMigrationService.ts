import { supabase } from "@/lib/supabase"
import { BookmarkGroup, Bookmark } from "@/types"

const GROUPS_KEY = "minitab_local_groups"
const BOOKMARKS_KEY = "minitab_local_bookmarks"

// 默认数据的 ID 前缀，用于区分用户自定义数据
const DEFAULT_GROUP_IDS = new Set(["default-hot"])
const DEFAULT_BOOKMARK_ID_PREFIX = "bk-"

export function hasLocalData(): boolean {
  const groups = localStorage.getItem(GROUPS_KEY)
  if (!groups) return false
  const parsed = JSON.parse(groups) as BookmarkGroup[]
  return parsed.length > 0
}

/**
 * 检测是否有用户自定义的本地数据（排除默认预置数据）
 * 仅当用户新增了分组或书签时返回 true
 */
export function hasLocalUserData(): boolean {
  const groupsRaw = localStorage.getItem(GROUPS_KEY)
  if (!groupsRaw) return false

  const groups: BookmarkGroup[] = JSON.parse(groupsRaw)
  const bookmarksRaw = localStorage.getItem(BOOKMARKS_KEY)
  const bookmarks: Bookmark[] = bookmarksRaw ? JSON.parse(bookmarksRaw) : []

  // 检查是否有非默认分组
  const hasUserGroups = groups.some((g) => !DEFAULT_GROUP_IDS.has(g.id))
  if (hasUserGroups) return true

  // 检查是否有非默认书签
  const hasUserBookmarks = bookmarks.some((b) => !b.id.startsWith(DEFAULT_BOOKMARK_ID_PREFIX))
  return hasUserBookmarks
}

export async function migrateLocalDataToSupabase(userId: string): Promise<void> {
  const groupsRaw = localStorage.getItem(GROUPS_KEY)
  const bookmarksRaw = localStorage.getItem(BOOKMARKS_KEY)
  if (!groupsRaw) return

  const localGroups: BookmarkGroup[] = JSON.parse(groupsRaw)
  const localBookmarks: Bookmark[] = bookmarksRaw ? JSON.parse(bookmarksRaw) : []

  const groupIdMap = new Map<string, string>()

  for (const group of localGroups) {
    const { data, error } = await supabase
      .from("bookmark_groups")
      .insert({
        name: group.name,
        user_id: userId,
        sort_order: group.sort_order,
      })
      .select()
      .single()
    if (error) {
      console.error("Failed to migrate group:", group.name, error)
      continue
    }
    groupIdMap.set(group.id, data.id)
  }

  for (const bookmark of localBookmarks) {
    const newGroupId = groupIdMap.get(bookmark.group_id)
    if (!newGroupId) continue

    const { error } = await supabase.from("bookmarks").insert({
      group_id: newGroupId,
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description,
      favicon_url: bookmark.favicon_url,
      sort_order: bookmark.sort_order,
    })
    if (error) {
      console.error("Failed to migrate bookmark:", bookmark.title, error)
    }
  }

  localStorage.removeItem(GROUPS_KEY)
  localStorage.removeItem(BOOKMARKS_KEY)
}

export function clearLocalData(): void {
  localStorage.removeItem(GROUPS_KEY)
  localStorage.removeItem(BOOKMARKS_KEY)
}
