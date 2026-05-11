import { useState, useEffect, memo, useMemo } from "react"
import { Pencil, Trash2, Bookmark as BookmarkIcon } from "lucide-react"
import { Bookmark } from "@/types"
import { getFaviconFallbackUrls, isStaleFaviconUrl } from "@/lib/fetchFavicon"

function truncateTitle(title: string, maxLen = 24): string {
  let len = 0
  for (let i = 0; i < title.length; i++) {
    len += title.charCodeAt(i) > 127 ? 2 : 1
    if (len > maxLen) return title.slice(0, i) + "…"
  }
  return title
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

interface BookmarkCardProps {
  bookmark: Bookmark
  onEdit: (bookmark: Bookmark) => void
  onDelete: (bookmark: Bookmark) => void
}

export const BookmarkCard = memo(function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imgError, setImgError] = useState(false)
  // 渲染层多级 fallback：当主 favicon_url 加载失败时，按顺序尝试多个备源
  // 兼容存量数据中失效的 favicon URL，无需迁移用户数据
  // -1 表示使用 bookmark.favicon_url 原值；>=0 表示使用 fallbackUrls[fallbackIndex]
  const [fallbackIndex, setFallbackIndex] = useState(-1)

  const fallbackUrls = useMemo(
    () => (bookmark.url ? getFaviconFallbackUrls(bookmark.url) : []),
    [bookmark.url]
  )

  // 老数据兼容：若 favicon_url 是已知会"假成功"的失效服务（如 favicon.vip 占位地球图），
  // 直接跳过它从 fallback 链第 0 个开始，避免存量书签永远卡在占位图上
  const skipStaleInitial = useMemo(
    () => isStaleFaviconUrl(bookmark.favicon_url),
    [bookmark.favicon_url]
  )

  // bookmark 切换时重置状态，避免不同书签共享 fallback 状态
  useEffect(() => {
    setImgError(false)
    setFallbackIndex(skipStaleInitial ? 0 : -1)
  }, [bookmark.id, bookmark.favicon_url, skipStaleInitial])

  const handleImgError = () => {
    const nextIndex = fallbackIndex + 1
    if (nextIndex < fallbackUrls.length) {
      // 还有备源可尝试
      setFallbackIndex(nextIndex)
    } else {
      // 所有备源都失败：显示占位图标
      setImgError(true)
    }
  }

  const displayFaviconUrl =
    fallbackIndex >= 0 ? fallbackUrls[fallbackIndex] : bookmark.favicon_url

  const handleClick = () => {
    window.open(bookmark.url, "_blank", "noopener,noreferrer")
  }

  return (
    <div
      className="relative flex items-center gap-2 p-4 rounded-[12px] cursor-pointer transition-all duration-200 bg-muted border border-transparent group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
        {!imgError && displayFaviconUrl ? (
          <img
            src={displayFaviconUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-125"
            loading="lazy"
            onError={handleImgError}
          />
        ) : (
          <BookmarkIcon className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-hover:scale-125" />
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground truncate">
          {truncateTitle(bookmark.title)}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {bookmark.description || getHostname(bookmark.url)}
        </span>
      </div>
      {isHovered && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(bookmark)
            }}
            className="w-6 h-6 flex items-center justify-center rounded-2xl hover:bg-border-strong cursor-pointer transition-colors"
          >
            <Pencil size={14} className="text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(bookmark)
            }}
            className="w-6 h-6 flex items-center justify-center rounded-2xl hover:bg-border-strong cursor-pointer transition-colors"
          >
            <Trash2 size={14} className="text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  )
})
