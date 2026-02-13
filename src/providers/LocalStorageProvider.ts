import { IDataProvider, BookmarkGroup, Bookmark } from "@/types"

const GROUPS_KEY = "minitab_local_groups"
const BOOKMARKS_KEY = "minitab_local_bookmarks"

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const DEFAULT_GROUPS: BookmarkGroup[] = [
  {
    id: "default-hot",
    name: "热门网站",
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: "bk-1",
    group_id: "default-hot",
    title: "元宝",
    url: "https://yuanbao.tencent.com",
    description: "腾讯推出的 AI 智能助手",
    favicon_url: "https://www.google.com/s2/favicons?domain=yuanbao.tencent.com&sz=64",
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "bk-2",
    group_id: "default-hot",
    title: "ChatGPT",
    url: "https://chat.openai.com",
    description: "OpenAI 推出的 AI 对话助手",
    favicon_url: "https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64",
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "bk-3",
    group_id: "default-hot",
    title: "即梦",
    url: "https://jimeng.jianying.com",
    description: "字节跳动推出的 AI 创作平台",
    favicon_url: "https://www.google.com/s2/favicons?domain=jimeng.jianying.com&sz=64",
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "bk-4",
    group_id: "default-hot",
    title: "Gemini",
    url: "https://gemini.google.com",
    description: "Google 推出的多模态 AI 助手",
    favicon_url: "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64",
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "bk-5",
    group_id: "default-hot",
    title: "Pinterest",
    url: "https://www.pinterest.com",
    description: "全球创意灵感图片分享平台",
    favicon_url: "https://www.google.com/s2/favicons?domain=pinterest.com&sz=64",
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "bk-6",
    group_id: "default-hot",
    title: "Dribbble",
    url: "https://dribbble.com",
    description: "设计师作品展示与交流社区",
    favicon_url: "https://www.google.com/s2/favicons?domain=dribbble.com&sz=64",
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "bk-7",
    group_id: "default-hot",
    title: "Behance",
    url: "https://www.behance.net",
    description: "Adobe 旗下创意作品展示平台",
    favicon_url: "https://www.google.com/s2/favicons?domain=behance.net&sz=64",
    sort_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function getLocalGroups(): BookmarkGroup[] {
  const data = localStorage.getItem(GROUPS_KEY)
  if (!data) {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(DEFAULT_GROUPS))
    return [...DEFAULT_GROUPS]
  }
  return JSON.parse(data)
}

function setLocalGroups(groups: BookmarkGroup[]) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
}

function getLocalBookmarks(): Bookmark[] {
  const data = localStorage.getItem(BOOKMARKS_KEY)
  if (!data) {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(DEFAULT_BOOKMARKS))
    return [...DEFAULT_BOOKMARKS]
  }
  return JSON.parse(data)
}

function setLocalBookmarks(bookmarks: Bookmark[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks))
}

export class LocalStorageProvider implements IDataProvider {
  async getGroups(): Promise<BookmarkGroup[]> {
    return getLocalGroups().sort((a, b) => a.sort_order - b.sort_order)
  }

  async createGroup(name: string): Promise<BookmarkGroup> {
    const groups = getLocalGroups()
    const newGroup: BookmarkGroup = {
      id: generateId(),
      name,
      sort_order: groups.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    groups.push(newGroup)
    setLocalGroups(groups)
    return newGroup
  }

  async updateGroup(id: string, name: string): Promise<BookmarkGroup> {
    const groups = getLocalGroups()
    const idx = groups.findIndex((g) => g.id === id)
    if (idx === -1) throw new Error("分组不存在")
    groups[idx] = { ...groups[idx], name, updated_at: new Date().toISOString() }
    setLocalGroups(groups)
    return groups[idx]
  }

  async deleteGroup(id: string): Promise<void> {
    const groups = getLocalGroups().filter((g) => g.id !== id)
    setLocalGroups(groups)
    const bookmarks = getLocalBookmarks().filter((b) => b.group_id !== id)
    setLocalBookmarks(bookmarks)
  }

  async getBookmarksByGroup(groupId: string): Promise<Bookmark[]> {
    return getLocalBookmarks()
      .filter((b) => b.group_id === groupId)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  async getAllBookmarks(): Promise<Bookmark[]> {
    return getLocalBookmarks().sort((a, b) => a.sort_order - b.sort_order)
  }

  async createBookmark(data: Omit<Bookmark, "id" | "created_at" | "updated_at">): Promise<Bookmark> {
    const bookmarks = getLocalBookmarks()
    const newBookmark: Bookmark = {
      ...data,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    bookmarks.push(newBookmark)
    setLocalBookmarks(bookmarks)
    return newBookmark
  }

  async updateBookmark(id: string, data: Partial<Bookmark>): Promise<Bookmark> {
    const bookmarks = getLocalBookmarks()
    const idx = bookmarks.findIndex((b) => b.id === id)
    if (idx === -1) throw new Error("书签不存在")
    bookmarks[idx] = { ...bookmarks[idx], ...data, updated_at: new Date().toISOString() }
    setLocalBookmarks(bookmarks)
    return bookmarks[idx]
  }

  async deleteBookmark(id: string): Promise<void> {
    const bookmarks = getLocalBookmarks().filter((b) => b.id !== id)
    setLocalBookmarks(bookmarks)
  }

  async searchBookmarks(query: string): Promise<Bookmark[]> {
    const q = query.toLowerCase()
    return getLocalBookmarks().filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q))
    )
  }

  async reorderGroups(orderedIds: string[]): Promise<void> {
    const groups = getLocalGroups()
    const reordered = orderedIds.map((id, index) => {
      const g = groups.find((g) => g.id === id)!
      return { ...g, sort_order: index, updated_at: new Date().toISOString() }
    })
    setLocalGroups(reordered)
  }
}
