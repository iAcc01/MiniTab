export interface BookmarkGroup {
  id: string
  user_id?: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Bookmark {
  id: string
  group_id: string
  title: string
  url: string
  description?: string
  favicon_url?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface IDataProvider {
  getGroups(): Promise<BookmarkGroup[]>
  createGroup(name: string): Promise<BookmarkGroup>
  updateGroup(id: string, name: string): Promise<BookmarkGroup>
  deleteGroup(id: string): Promise<void>
  getBookmarksByGroup(groupId: string): Promise<Bookmark[]>
  getAllBookmarks(): Promise<Bookmark[]>
  createBookmark(data: Omit<Bookmark, "id" | "created_at" | "updated_at">): Promise<Bookmark>
  updateBookmark(id: string, data: Partial<Bookmark>): Promise<Bookmark>
  deleteBookmark(id: string): Promise<void>
  searchBookmarks(query: string): Promise<Bookmark[]>
  reorderGroups(orderedIds: string[]): Promise<void>
}

export interface NavItem {
  id: string
  label: string
  icon: string
  path: string
}

export type DialogType =
  | "createGroup"
  | "editGroup"
  | "addBookmark"
  | "editBookmark"
  | "importBookmark"
  | "deleteGroup"
  | "deleteBookmark"
  | null
