import { useState, memo } from "react"
import { Pencil, Trash2, Bookmark as BookmarkIcon } from "lucide-react"
import { Bookmark } from "@/types"
import { useFaviconLoader } from "@/hooks/useFaviconLoader"

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

  // 统一处理图标加载：内网超时、外网跨域错误、多级 fallback、老数据中 stale URL 跳过
  // 加载失败时 url === null，下方渲染本地 BookmarkIcon 兜底
  const { url: faviconUrl, status, onImgError } = useFaviconLoader(
    bookmark.favicon_url,
    bookmark.url
  )

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
        {status === "loaded" && faviconUrl ? (
          <img
            src={faviconUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-125"
            loading="lazy"
            onError={onImgError}
          />
        ) : (
          // status === "loading" 时也展示占位，避免空白闪烁
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
