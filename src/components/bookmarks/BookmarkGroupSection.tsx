import { useState, forwardRef } from "react"
import { Plus, Pencil, Download, Trash2 } from "lucide-react"
import { BookmarkGroup, Bookmark } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
import { BookmarkCard } from "./BookmarkCard"
import { AddBookmarkCard } from "./AddBookmarkCard"

interface BookmarkGroupSectionProps {
  group: BookmarkGroup
  bookmarks: Bookmark[]
  onAddBookmark: (groupId: string) => void
  onEditBookmark: (bookmark: Bookmark) => void
  onDeleteBookmark: (bookmark: Bookmark) => void
  onEditGroup: (group: BookmarkGroup) => void
  onDeleteGroup: (group: BookmarkGroup) => void
  onExportGroup: (group: BookmarkGroup) => void
}

export const BookmarkGroupSection = forwardRef<HTMLDivElement, BookmarkGroupSectionProps>(function BookmarkGroupSection({
  group,
  bookmarks,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onEditGroup,
  onDeleteGroup,
  onExportGroup,
}, ref) {
  const { isAuthenticated } = useAuth()
  const [isHovered, setIsHovered] = useState(false)

  const actionButtons = [
    { icon: Plus, label: "添加", onClick: () => onAddBookmark(group.id) },
    { icon: Pencil, label: "编辑", onClick: () => onEditGroup(group) },
    { icon: Download, label: "导出", onClick: () => onExportGroup(group) },
    { icon: Trash2, label: "删除", onClick: () => onDeleteGroup(group) },
  ]

  return (
    <div ref={ref} data-group-id={group.id} className="mb-8">
      {/* 分组标题行 */}
      <div
        className="flex items-center justify-between mb-4 h-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h2 className="text-xl font-semibold text-foreground leading-8">{group.name}</h2>
        {isHovered && isAuthenticated && (
          <div className="flex items-center gap-2">
            {actionButtons.map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                title={btn.label}
                className="w-8 h-8 flex items-center justify-center rounded-2xl bg-card-hover hover:bg-border-strong cursor-pointer transition-colors"
              >
                <btn.icon size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 书签网格 */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            onEdit={onEditBookmark}
            onDelete={onDeleteBookmark}
          />
        ))}
        {isAuthenticated && bookmarks.length === 0 && (
          <AddBookmarkCard onClick={() => onAddBookmark(group.id)} />
        )}
      </div>
    </div>
  )
})
