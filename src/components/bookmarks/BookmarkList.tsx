import { RefObject } from "react"
import { BookmarkGroup, Bookmark } from "@/types"
import { BookmarkGroupSection } from "./BookmarkGroupSection"

interface BookmarkListProps {
  groups: BookmarkGroup[]
  getBookmarksByGroup: (groupId: string) => Bookmark[]
  onAddBookmark: (groupId: string) => void
  onEditBookmark: (bookmark: Bookmark) => void
  onDeleteBookmark: (bookmark: Bookmark) => void
  onEditGroup: (group: BookmarkGroup) => void
  onDeleteGroup: (group: BookmarkGroup) => void
  onExportGroup: (group: BookmarkGroup) => void
  sectionRefs?: RefObject<Map<string, HTMLDivElement>>
}

export function BookmarkList({
  groups,
  getBookmarksByGroup,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onEditGroup,
  onDeleteGroup,
  onExportGroup,
  sectionRefs,
}: BookmarkListProps) {
  return (
    <div className="mt-12">
      {groups.map((group) => (
        <BookmarkGroupSection
          key={group.id}
          ref={(el) => {
            if (el && sectionRefs?.current) {
              sectionRefs.current.set(group.id, el)
            }
          }}
          group={group}
          bookmarks={getBookmarksByGroup(group.id)}
          onAddBookmark={onAddBookmark}
          onEditBookmark={onEditBookmark}
          onDeleteBookmark={onDeleteBookmark}
          onEditGroup={onEditGroup}
          onDeleteGroup={onDeleteGroup}
          onExportGroup={onExportGroup}
        />
      ))}
    </div>
  )
}
