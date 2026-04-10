import { supabase } from "@/lib/supabase"
import { IDataProvider, BookmarkGroup, Bookmark } from "@/types"

const DEFAULT_GROUP_NAME = "热门网站"

const DEFAULT_BOOKMARKS_DATA: Omit<Bookmark, "id" | "group_id" | "created_at" | "updated_at">[] = [
  {
    title: "元宝",
    url: "https://yuanbao.tencent.com",
    description: "腾讯推出的 AI 智能助手",
    favicon_url: "https://www.google.com/s2/favicons?domain=yuanbao.tencent.com&sz=64",
    sort_order: 0,
  },
  {
    title: "ChatGPT",
    url: "https://chat.openai.com",
    description: "OpenAI 推出的 AI 对话助手",
    favicon_url: "https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64",
    sort_order: 1,
  },
  {
    title: "即梦",
    url: "https://jimeng.jianying.com",
    description: "字节跳动推出的 AI 创作平台",
    favicon_url: "https://www.google.com/s2/favicons?domain=jimeng.jianying.com&sz=64",
    sort_order: 2,
  },
  {
    title: "Gemini",
    url: "https://gemini.google.com",
    description: "Google 推出的多模态 AI 助手",
    favicon_url: "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64",
    sort_order: 3,
  },
  {
    title: "Pinterest",
    url: "https://www.pinterest.com",
    description: "全球创意灵感图片分享平台",
    favicon_url: "https://www.google.com/s2/favicons?domain=pinterest.com&sz=64",
    sort_order: 4,
  },
  {
    title: "Dribbble",
    url: "https://dribbble.com",
    description: "设计师作品展示与交流社区",
    favicon_url: "https://www.google.com/s2/favicons?domain=dribbble.com&sz=64",
    sort_order: 5,
  },
  {
    title: "Behance",
    url: "https://www.behance.net",
    description: "Adobe 旗下创意作品展示平台",
    favicon_url: "https://www.google.com/s2/favicons?domain=behance.net&sz=64",
    sort_order: 6,
  },
]

export class SupabaseProvider implements IDataProvider {
  private userId: string
  private ensureDefaultPromise: Promise<void> | null = null

  // 请求缓存：避免短时间内重复请求
  private groupsCache: { data: BookmarkGroup[]; ts: number } | null = null
  private groupsInflight: Promise<BookmarkGroup[]> | null = null
  private static CACHE_TTL = 5000 // 5秒缓存

  constructor(userId: string) {
    this.userId = userId
  }

  /** 清除缓存（在数据变更后调用） */
  private invalidateGroupsCache() {
    this.groupsCache = null
    this.groupsInflight = null
  }

  /**
   * 新用户首次登录时，初始化默认的"热门网站"分组和书签
   * 使用 Promise 去重，防止并发调用导致多次初始化
   */
  private ensureDefaultData(): Promise<void> {
    if (this.ensureDefaultPromise) return this.ensureDefaultPromise

    this.ensureDefaultPromise = this._doEnsureDefaultData()
    return this.ensureDefaultPromise
  }

  private async _doEnsureDefaultData(): Promise<void> {
    const { data: existingGroups, error } = await supabase
      .from("bookmark_groups")
      .select("id")
      .eq("user_id", this.userId)
      .limit(1)

    if (error) {
      console.error("Failed to check existing groups:", error)
      return
    }

    // 已有数据，不需要初始化
    if (existingGroups && existingGroups.length > 0) return

    // 创建默认分组
    const { data: groupData, error: groupError } = await supabase
      .from("bookmark_groups")
      .insert({
        name: DEFAULT_GROUP_NAME,
        user_id: this.userId,
        sort_order: 0,
      })
      .select()
      .single()

    if (groupError || !groupData) {
      console.error("Failed to create default group:", groupError)
      return
    }

    // 创建默认书签
    const bookmarksToInsert = DEFAULT_BOOKMARKS_DATA.map((b) => ({
      ...b,
      group_id: groupData.id,
    }))

    const { error: bookmarkError } = await supabase
      .from("bookmarks")
      .insert(bookmarksToInsert)

    if (bookmarkError) {
      console.error("Failed to create default bookmarks:", bookmarkError)
    }
  }

  async getGroups(): Promise<BookmarkGroup[]> {
    await this.ensureDefaultData()

    // 命中缓存
    if (this.groupsCache && Date.now() - this.groupsCache.ts < SupabaseProvider.CACHE_TTL) {
      return this.groupsCache.data
    }

    // 去重：如果已有在进行中的请求，复用它
    if (this.groupsInflight) return this.groupsInflight

    this.groupsInflight = this._fetchGroups()
    try {
      const result = await this.groupsInflight
      return result
    } finally {
      this.groupsInflight = null
    }
  }

  private async _fetchGroups(): Promise<BookmarkGroup[]> {
    const { data, error } = await supabase
      .from("bookmark_groups")
      .select("*")
      .eq("user_id", this.userId)
      .order("sort_order", { ascending: true })
    if (error) {
      console.error("Failed to fetch groups:", error)
      return []
    }
    const result = data || []
    this.groupsCache = { data: result, ts: Date.now() }
    return result
  }

  async createGroup(name: string): Promise<BookmarkGroup> {
    const { data: existing } = await supabase
      .from("bookmark_groups")
      .select("sort_order")
      .eq("user_id", this.userId)
      .order("sort_order", { ascending: false })
      .limit(1)
    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

    const { data, error } = await supabase
      .from("bookmark_groups")
      .insert({ name, user_id: this.userId, sort_order: nextOrder })
      .select()
      .single()
    if (error) {
      console.error("Failed to create group:", error)
      throw error
    }
    this.invalidateGroupsCache()
    return data
  }

  async updateGroup(id: string, name: string): Promise<BookmarkGroup> {
    const { data, error } = await supabase
      .from("bookmark_groups")
      .update({ name })
      .eq("id", id)
      .select()
      .single()
    if (error) {
      console.error("Failed to update group:", error)
      throw error
    }
    this.invalidateGroupsCache()
    return data
  }

  async deleteGroup(id: string): Promise<void> {
    const { error } = await supabase.from("bookmark_groups").delete().eq("id", id)
    if (error) {
      console.error("Failed to delete group:", error)
      throw error
    }
    this.invalidateGroupsCache()
  }

  async getBookmarksByGroup(groupId: string): Promise<Bookmark[]> {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("group_id", groupId)
      .order("sort_order", { ascending: true })
    if (error) {
      console.error("Failed to fetch bookmarks:", error)
      return []
    }
    return data || []
  }

  async getAllBookmarks(): Promise<Bookmark[]> {
    await this.ensureDefaultData()

    // 直接通过用户分组关联查询所有书签，不再串行调 getGroups
    const { data: groups } = await supabase
      .from("bookmark_groups")
      .select("id")
      .eq("user_id", this.userId)

    if (!groups || groups.length === 0) return []

    const groupIds = groups.map((g) => g.id)
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .in("group_id", groupIds)
      .order("sort_order", { ascending: true })
    if (error) {
      console.error("Failed to fetch all bookmarks:", error)
      return []
    }
    return data || []
  }

  async createBookmark(data: Omit<Bookmark, "id" | "created_at" | "updated_at">): Promise<Bookmark> {
    const { data: result, error } = await supabase
      .from("bookmarks")
      .insert(data)
      .select()
      .single()
    if (error) {
      console.error("Failed to create bookmark:", error)
      throw error
    }
    return result
  }

  async updateBookmark(id: string, data: Partial<Bookmark>): Promise<Bookmark> {
    const { id: _, created_at: __, updated_at: ___, ...updateData } = data as Bookmark
    const { data: result, error } = await supabase
      .from("bookmarks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()
    if (error) {
      console.error("Failed to update bookmark:", error)
      throw error
    }
    return result
  }

  async deleteBookmark(id: string): Promise<void> {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id)
    if (error) {
      console.error("Failed to delete bookmark:", error)
      throw error
    }
  }

  async searchBookmarks(query: string): Promise<Bookmark[]> {
    const { data: groups } = await supabase
      .from("bookmark_groups")
      .select("id")
      .eq("user_id", this.userId)

    if (!groups || groups.length === 0) return []
    const groupIds = groups.map((g) => g.id)
    const q = `%${query}%`
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .in("group_id", groupIds)
      .or(`title.ilike.${q},url.ilike.${q},description.ilike.${q}`)
    if (error) {
      console.error("Failed to search bookmarks:", error)
      return []
    }
    return data || []
  }

  async reorderGroups(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      supabase.from("bookmark_groups").update({ sort_order: index }).eq("id", id)
    )
    const results = await Promise.all(updates)
    const failed = results.find((r) => r.error)
    if (failed?.error) {
      console.error("Failed to reorder groups:", failed.error)
      throw failed.error
    }
    this.invalidateGroupsCache()
  }
}
