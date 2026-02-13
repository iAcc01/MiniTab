import { useEffect, useRef } from "react"
import { Search, ExternalLink } from "lucide-react"
import { useSearch } from "@/hooks/useSearch"
import { Bookmark as BookmarkIcon } from "lucide-react"

interface SearchPanelProps {
  open: boolean
  onClose: () => void
}

export function SearchPanel({ open, onClose }: SearchPanelProps) {
  const { query, setQuery, results, isSearching, isEmpty, clearSearch } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      clearSearch()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: "rgba(0,0,0,0.70)" }}
      onClick={onClose}
    >
      <div
        className="w-[720px] h-[420px] bg-background rounded-xl border border-border shadow-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 搜索输入区 */}
        <div className="flex items-center h-[65px] px-8 border-b border-border-strong">
          <Search size={20} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索书签..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 ml-3 text-lg bg-transparent outline-none text-foreground placeholder:text-placeholder"
          />
        </div>

        {/* 搜索结果区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isSearching && (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-muted-foreground">搜索中...</span>
            </div>
          )}

          {!isSearching && isEmpty && query.trim() && (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-muted-foreground">搜索结果为空</span>
            </div>
          )}

          {!isSearching && !isEmpty && results.length > 0 && (
            <div className="flex flex-col gap-2">
              {results.map((bookmark) => (
                <a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover shadow-card transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-card-hover flex items-center justify-center flex-shrink-0">
                    {bookmark.favicon_url ? (
                      <img
                        src={bookmark.favicon_url}
                        alt=""
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    ) : (
                      <BookmarkIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground truncate">{bookmark.title}</span>
                    <span className="text-xs text-muted-foreground truncate">{bookmark.description || bookmark.url}</span>
                  </div>
                  <div className="w-8 h-8 rounded-2xl bg-card-hover flex items-center justify-center flex-shrink-0">
                    <ExternalLink size={14} className="text-muted-foreground" />
                  </div>
                </a>
              ))}
            </div>
          )}

          {!isSearching && !query.trim() && (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-muted-foreground">输入关键词搜索书签</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
