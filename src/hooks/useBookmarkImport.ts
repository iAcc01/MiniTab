import { useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { getFaviconUrl } from "@/hooks/useBookmarks"
import { fetchSiteDescription } from "@/lib/fetchSiteDescription"

interface ParsedGroup {
  name: string
  bookmarks: { title: string; url: string; icon?: string; description?: string }[]
}

export function useBookmarkImport() {
  const { dataProvider } = useAuth()
  const { showToast } = useToast()

  const parseBookmarkFile = useCallback((content: string): ParsedGroup[] => {
    const trimmed = content.trim()
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const json = JSON.parse(trimmed)
        return parseJsonBookmarks(json)
      } catch {
        // JSON 解析失败，fallback 到 HTML 解析
      }
    }
    return parseHtmlBookmarks(content)
  }, [])

  const importBookmarks = useCallback(
    async (parsedGroups: ParsedGroup[]) => {
      try {
        for (const group of parsedGroups) {
          const newGroup = await dataProvider.createGroup(group.name)

          const descPromises = group.bookmarks.map((bk) =>
            bk.description
              ? Promise.resolve(bk.description)
              : fetchSiteDescription(bk.url).catch(() => "")
          )
          const descriptions = await Promise.all(descPromises)

          for (let i = 0; i < group.bookmarks.length; i++) {
            const bk = group.bookmarks[i]
            let faviconUrl = bk.icon
            if (!faviconUrl || !faviconUrl.startsWith("data:")) {
              faviconUrl = getFaviconUrl(bk.url)
            }
            await dataProvider.createBookmark({
              group_id: newGroup.id,
              title: bk.title,
              url: bk.url,
              description: descriptions[i] || "",
              favicon_url: faviconUrl,
              sort_order: i,
            })
          }
        }
        showToast("success", "书签导入成功")
      } catch {
        showToast("error", "导入书签失败，请稍后重试")
      }
    },
    [dataProvider, showToast]
  )

  return { parseBookmarkFile, importBookmarks }
}

/** 从对象中提取 URL（兼容多种字段名） */
function getUrl(obj: any): string | undefined {
  return obj.url || obj.link || obj.href || obj.website || obj.uri || undefined
}

/** 从对象中提取标题 */
function getTitle(obj: any, fallbackUrl?: string): string {
  return (obj.customTitle || obj.title || obj.name || obj.label || obj.text || fallbackUrl || "").trim()
}

/** 从对象中提取描述 */
function getDesc(obj: any): string {
  return (obj.customDescription || obj.description || obj.desc || obj.summary || obj.note || obj.intro || "").trim()
}

/** 从对象中提取图标 */
function getIcon(obj: any): string | undefined {
  return obj.icon || obj.favicon || obj.favicon_url || obj.logo || undefined
}

/** 将一个对象转为书签（如果包含有效 URL） */
function toBookmark(obj: any): ParsedGroup["bookmarks"][0] | null {
  const url = getUrl(obj)
  if (!url) return null
  return {
    title: getTitle(obj, url),
    url,
    icon: getIcon(obj),
    description: getDesc(obj),
  }
}

/** 解析 JSON 格式书签 */
function parseJsonBookmarks(json: unknown): ParsedGroup[] {
  const groups: ParsedGroup[] = []

  if (Array.isArray(json)) {
    // 检查是否是分组数组
    const hasGroups = json.some(
      (item) =>
        item &&
        typeof item === "object" &&
        !getUrl(item) &&
        (item.bookmarks || item.children || item.items || item.links || item.cards)
    )

    if (hasGroups) {
      for (const g of json) {
        const items = g.bookmarks || g.children || g.items || g.links || g.cards || []
        if (!Array.isArray(items)) continue
        const bookmarks = items.map((b: any) => toBookmark(b)).filter(Boolean) as ParsedGroup["bookmarks"]
        if (bookmarks.length > 0) {
          groups.push({ name: getTitle(g, "导入的书签") || "导入的书签", bookmarks })
        }
      }
    } else {
      // 扁平书签数组
      const bookmarks = json.map((b: any) => toBookmark(b)).filter(Boolean) as ParsedGroup["bookmarks"]
      if (bookmarks.length > 0) {
        groups.push({ name: "导入的书签", bookmarks })
      }
    }
    return groups
  }

  if (typeof json === "object" && json !== null) {
    const obj = json as Record<string, any>

    // 看板/列表格式：{ lists: [{ title, cards: [...] }] }
    if (Array.isArray(obj.lists)) {
      for (const list of obj.lists) {
        const cards = list.cards || list.items || list.bookmarks || list.children || []
        if (!Array.isArray(cards)) continue
        const bookmarks = cards.map((b: any) => toBookmark(b)).filter(Boolean) as ParsedGroup["bookmarks"]
        if (bookmarks.length > 0) {
          groups.push({ name: getTitle(list, "导入的书签") || "导入的书签", bookmarks })
        }
      }
      return groups
    }

    // Chrome 书签 JSON 格式
    if (obj.roots) {
      for (const key of Object.keys(obj.roots)) {
        const root = obj.roots[key]
        if (root && root.children) {
          extractChromeNodes(root.children, root.name || key, groups)
        }
      }
      return groups
    }

    // 对象有 URL → 单书签
    if (getUrl(obj)) {
      const bk = toBookmark(obj)
      if (bk) groups.push({ name: "导入的书签", bookmarks: [bk] })
      return groups
    }

    // 对象包含书签列表
    const items = obj.bookmarks || obj.children || obj.items || obj.links || obj.data || obj.list
    if (Array.isArray(items)) {
      const bookmarks = items.map((b: any) => toBookmark(b)).filter(Boolean) as ParsedGroup["bookmarks"]
      if (bookmarks.length > 0) {
        groups.push({ name: getTitle(obj, "导入的书签") || "导入的书签", bookmarks })
      }
      return groups
    }

    // 最后尝试：遍历对象的所有值，看是否有数组值包含书签
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
        const bookmarks = val.map((b: any) => toBookmark(b)).filter(Boolean) as ParsedGroup["bookmarks"]
        if (bookmarks.length > 0) {
          groups.push({ name: key, bookmarks })
        }
      }
    }
  }

  return groups
}

/** 递归提取 Chrome 书签 JSON 节点 */
function extractChromeNodes(nodes: any[], groupName: string, groups: ParsedGroup[]) {
  const bookmarks: ParsedGroup["bookmarks"] = []
  for (const node of nodes) {
    if (node.type === "folder" && node.children) {
      extractChromeNodes(node.children, node.name || "未命名分组", groups)
    } else {
      const bk = toBookmark(node)
      if (bk) bookmarks.push(bk)
    }
  }
  if (bookmarks.length > 0) {
    groups.push({ name: groupName, bookmarks })
  }
}

/** 智能拆分网页标题为名称+简介 */
function splitTitleAndDesc(rawTitle: string): { title: string; description: string } {
  const text = rawTitle.trim()
  // 常见分隔符：" - ", " | ", " :: ", " – ", " — ", " · "
  const separators = [" :: ", " | ", " - ", " – ", " — ", " · "]
  for (const sep of separators) {
    const idx = text.indexOf(sep)
    if (idx > 0 && idx < text.length - sep.length) {
      const left = text.slice(0, idx).trim()
      const right = text.slice(idx + sep.length).trim()
      // 取较短的一方作为名称，较长的作为简介
      if (left.length <= right.length) {
        return { title: left, description: right }
      } else {
        return { title: right, description: left }
      }
    }
  }
  return { title: text, description: "" }
}

/** 解析 HTML 格式书签 */
function parseHtmlBookmarks(html: string): ParsedGroup[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const groups: ParsedGroup[] = []

  // 递归遍历 DL 结构
  function walkDL(dl: Element, groupName: string) {
    const bookmarks: ParsedGroup["bookmarks"] = []
    const children = Array.from(dl.children)

    for (let i = 0; i < children.length; i++) {
      const child = children[i]

      if (child.tagName === "DT") {
        // DT 内含 H3 → 文件夹，下一个兄弟 DL 是其内容
        const h3 = child.querySelector(":scope > H3")
        if (h3) {
          const folderName = (h3.textContent || "").trim() || "未命名分组"
          // 查找紧跟的 DL（可能是下一个兄弟，也可能是 DT 内的子元素）
          const subDL = child.querySelector(":scope > DL") || children[i + 1]
          if (subDL && subDL.tagName === "DL") {
            walkDL(subDL, folderName)
          }
          continue
        }

        // DT 内含 A → 书签
        const anchor = child.querySelector(":scope > A") as HTMLAnchorElement | null
        if (anchor && anchor.href) {
          const nextSib = children[i + 1]
          const ddDesc = nextSib && nextSib.tagName === "DD" ? (nextSib.textContent || "").trim() : ""
          const rawText = (anchor.textContent || anchor.href).trim()
          const { title, description } = splitTitleAndDesc(rawText)
          bookmarks.push({
            title,
            url: anchor.href,
            icon: anchor.getAttribute("ICON") || undefined,
            description: ddDesc || description,
          })
        }
      }
    }

    if (bookmarks.length > 0) {
      groups.push({ name: groupName, bookmarks })
    }
  }

  // 从根 DL 开始递归
  const rootDL = doc.querySelector("DL")
  if (rootDL) {
    walkDL(rootDL, "导入的书签")
  }

  // 如果递归没找到，fallback：提取所有 A 标签
  if (groups.length === 0) {
    const allLinks = doc.querySelectorAll("A")
    const bookmarks: ParsedGroup["bookmarks"] = []
    allLinks.forEach((a) => {
      const anchor = a as HTMLAnchorElement
      if (anchor.href && anchor.href.startsWith("http")) {
        const rawText = (anchor.textContent || anchor.href).trim()
        const { title, description } = splitTitleAndDesc(rawText)
        bookmarks.push({
          title,
          url: anchor.href,
          icon: anchor.getAttribute("ICON") || undefined,
          description,
        })
      }
    })
    if (bookmarks.length > 0) {
      groups.push({ name: "导入的书签", bookmarks })
    }
  }

  return groups
}
