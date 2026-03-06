import { useEffect, useRef } from "react"
import { Search, ExternalLink, Plus, Loader2 } from "lucide-react"
import { Bookmark as BookmarkIcon } from "lucide-react"
import { useSearch } from "@/hooks/useSearch"
import { useAuth } from "@/contexts/AuthContext"
import { ExternalSearchResult } from "@/lib/externalSearch"

interface SearchPanelProps {
  open: boolean
  onClose: () => void
  onAddFromExternal?: (data: { title: string; url: string; description: string; favicon_url: string }) => void
  onRequestLogin?: () => void
}

export function SearchPanel({ open, onClose, onAddFromExternal, onRequestLogin }: SearchPanelProps) {
  const { isAuthenticated } = useAuth()
  const {
    query,
    setQuery,
    results,
    externalResults,
    isSearching,
    isSearchingExternal,
    isEmpty,
    clearSearch,
  } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      clearSearch()
    }
  }, [open])

  if (!open) return null

  const hasInternalResults = results.length > 0
  const hasExternalResults = externalResults.length > 0
  const hasQuery = query.trim().length > 0

  const handleAddExternal = (item: ExternalSearchResult) => {
    onAddFromExternal?.({
      title: item.title,
      url: item.url,
      description: item.description,
      favicon_url: item.favicon_url,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: "rgba(0,0,0,0.70)" }}
      onClick={onClose}
    >
      <div
        className="w-[720px] max-h-[520px] bg-background rounded-xl border border-border shadow-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 搜索输入区 */}
        <div className="flex items-center h-[65px] px-8 border-b border-border-strong flex-shrink-0">
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
          {/* 搜索中状态 */}
          {isSearching && (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={20} className="animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">搜索中...</span>
            </div>
          )}

          {/* 无查询时的提示 */}
          {!isSearching && !hasQuery && (
            <div className="flex items-center justify-center h-32">
              <span className="text-sm text-muted-foreground">输入关键词搜索书签</span>
            </div>
          )}

          {/* 有查询时展示结果 */}
          {!isSearching && hasQuery && (
            <div className="flex flex-col gap-4">
              {/* 第一部分：站内搜索结果 */}
              {hasInternalResults && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-1">我的书签</div>
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
                                ;(e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          ) : (
                            <BookmarkIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-medium text-foreground truncate">
                            {bookmark.title}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {bookmark.description || bookmark.url}
                          </span>
                        </div>
                        <div className="w-8 h-8 rounded-2xl bg-card-hover flex items-center justify-center flex-shrink-0">
                          <ExternalLink size={14} className="text-muted-foreground" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 第二部分：外部搜索结果 */}
              {(hasExternalResults || isSearchingExternal) && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                    网络搜索结果
                  </div>
                  {isSearchingExternal && !hasExternalResults && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={16} className="animate-spin text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">正在搜索网络...</span>
                    </div>
                  )}
                  {hasExternalResults && (
                    <div className="flex flex-col gap-2">
                      {externalResults.map((item, index) => (
                        <div
                          key={`ext-${index}`}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover shadow-card transition-colors cursor-pointer"
                          onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                        >
                          <div className="w-10 h-10 rounded-xl bg-card-hover flex items-center justify-center flex-shrink-0">
                            {item.favicon_url ? (
                              <img
                                src={item.favicon_url}
                                alt=""
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).style.display = "none"
                                }}
                              />
                            ) : (
                              <BookmarkIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {item.description || item.url}
                            </span>
                          </div>
                          {isAuthenticated ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddExternal(item)
                              }}
                              className="w-8 h-8 rounded-2xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors"
                              title="添加到书签"
                            >
                              <Plus size={16} className="text-primary" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onRequestLogin?.()
                                }}
                                className="w-8 h-8 rounded-2xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors"
                                title="登录后添加到书签"
                              >
                                <Plus size={16} className="text-primary" />
                              </button>
                              <div className="w-8 h-8 rounded-2xl bg-card-hover flex items-center justify-center flex-shrink-0">
                                <ExternalLink size={14} className="text-muted-foreground" />
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 完全无结果 */}
              {!hasInternalResults && !hasExternalResults && !isSearchingExternal && (
                <div className="flex items-center justify-center h-32">
                  <span className="text-sm text-muted-foreground">未找到相关结果</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
