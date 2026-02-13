import { supabase } from "@/lib/supabase"
import { IDataProvider, BookmarkGroup, Bookmark } from "@/types"

export class SupabaseProvider implements IDataProvider {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async getGroups(): Promise<BookmarkGroup[]> {
    const { data, error } = await supabase
      .from("bookmark_groups")
      .select("*")
      .eq("user_id", this.userId)
      .order("sort_order", { ascending: true })
    if (error) {
      console.error("Failed to fetch groups:", error)
      return []
    }
    return data || []
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
    return data
  }

  async deleteGroup(id: string): Promise<void> {
    const { error } = await supabase.from("bookmark_groups").delete().eq("id", id)
    if (error) {
      console.error("Failed to delete group:", error)
      throw error
    }
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
    const groups = await this.getGroups()
    if (groups.length === 0) return []
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
    const groups = await this.getGroups()
    if (groups.length === 0) return []
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
  }
}
