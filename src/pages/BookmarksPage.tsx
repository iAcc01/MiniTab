import { useState, useCallback, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import { BookmarkGroup, Bookmark, DialogType } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
import { useSidebar } from "@/contexts/SidebarContext"
import { useToast } from "@/contexts/ToastContext"
import { useGroups } from "@/hooks/useGroups"
import { useBookmarks } from "@/hooks/useBookmarks"
import { AppLayout } from "@/components/layout/AppLayout"
import { Sidebar } from "@/components/layout/Sidebar"
import { MainContent } from "@/components/layout/MainContent"
import { CarouselBanner } from "@/components/carousel/CarouselBanner"
import { BookmarkList } from "@/components/bookmarks/BookmarkList"
import { BookmarkListSkeleton } from "@/components/bookmarks/BookmarkSkeleton"
import { SearchPanel } from "@/components/search/SearchPanel"
import { FloatingActions } from "@/components/common/FloatingActions"
import { CreateGroupDialog } from "@/components/dialogs/CreateGroupDialog"
import { EditGroupDialog } from "@/components/dialogs/EditGroupDialog"
import { AddBookmarkDialog } from "@/components/dialogs/AddBookmarkDialog"
import { EditBookmarkDialog } from "@/components/dialogs/EditBookmarkDialog"
import { ImportBookmarkDialog } from "@/components/dialogs/ImportBookmarkDialog"
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog"

export function BookmarksPage() {
  const { isAuthenticated } = useAuth()
  const { activeNav, setActiveGroupId, scrollToGroupRef } = useSidebar()
  const { showToast } = useToast()
  const { groups, loading: groupsLoading, addGroup, updateGroup, deleteGroup, reorderGroups, fetchGroups } = useGroups()
  const { allBookmarks, loading: bookmarksLoading, fetchBookmarks, addBookmark, updateBookmark, deleteBookmark, getBookmarksByGroup } = useBookmarks()

  const [activeDialog, setActiveDialog] = useState<DialogType>(null)
  const [selectedGroup, setSelectedGroup] = useState<BookmarkGroup | null>(null)
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null)
  const [defaultGroupId, setDefaultGroupId] = useState<string>("")
  const [searchOpen, setSearchOpen] = useState(false)

  const mainContentRef = useRef<HTMLElement>(null)
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const isScrollingTo = useRef(false)

  // 注册 scrollToGroup 方法供 Sidebar 调用
  useEffect(() => {
    scrollToGroupRef.current = (groupId: string) => {
      const el = sectionRefs.current.get(groupId)
      if (el && mainContentRef.current) {
        isScrollingTo.current = true
        setActiveGroupId(groupId)
        el.scrollIntoView({ behavior: "smooth", block: "start" })
        // smooth scroll 结束后恢复滚动监听
        setTimeout(() => {
          isScrollingTo.current = false
        }, 600)
      }
    }
    return () => {
      scrollToGroupRef.current = null
    }
  }, [scrollToGroupRef, setActiveGroupId])

  // 滚动监听：根据可视区域自动选中二级菜单
  useEffect(() => {
    if (activeNav !== "bookmarks") return
    const container = mainContentRef.current
    if (!container) return

    const handleScroll = () => {
      if (isScrollingTo.current) return
      if (groups.length === 0) return

      const containerTop = container.getBoundingClientRect().top
      let closestId: string | null = null
      let closestDistance = Infinity

      for (const [groupId, el] of sectionRefs.current.entries()) {
        const rect = el.getBoundingClientRect()
        const distance = Math.abs(rect.top - containerTop)
        if (rect.top <= containerTop + 100 && distance < closestDistance) {
          closestDistance = distance
          closestId = groupId
        }
      }

      // 如果没有任何 section 在顶部上方，选第一个
      if (!closestId && groups.length > 0) {
        closestId = groups[0].id
      }

      if (closestId) {
        setActiveGroupId(closestId)
      }
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [activeNav, groups, setActiveGroupId])

  const handleCreateGroup = async (name: string) => {
    await addGroup(name)
  }

  const handleEditGroup = async (id: string, name: string) => {
    await updateGroup(id, name)
  }

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return
    await deleteGroup(selectedGroup.id)
    setSelectedGroup(null)
  }

  const handleAddBookmark = async (data: {
    title: string
    url: string
    group_id: string
    description: string
    favicon_url: string
  }) => {
    await addBookmark({
      ...data,
      sort_order: allBookmarks.filter((b) => b.group_id === data.group_id).length,
    })
  }

  const handleEditBookmark = async (id: string, data: Partial<Bookmark>) => {
    await updateBookmark(id, data)
  }

  const handleDeleteBookmark = async () => {
    if (!selectedBookmark) return
    await deleteBookmark(selectedBookmark.id)
    setSelectedBookmark(null)
  }

  const handleExportGroup = useCallback(
    (group: BookmarkGroup) => {
      try {
        const groupBookmarks = getBookmarksByGroup(group.id)
        const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
<DT><H3>${group.name}</H3>
<DL><p>
${groupBookmarks.map((b) => `<DT><A HREF="${b.url}">${b.title}</A>`).join("\n")}
</DL><p>
</DL><p>`
        const blob = new Blob([html], { type: "text/html" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${group.name}_bookmarks.html`
        a.click()
        URL.revokeObjectURL(url)
        showToast("success", "书签导出成功")
      } catch {
        showToast("error", "导出失败，请稍后重试")
      }
    },
    [getBookmarksByGroup, showToast]
  )

  return (
    <AppLayout
      sidebar={
        <Sidebar
          groups={groups}
          onCreateGroup={() => setActiveDialog("createGroup")}
          onImportBookmarks={() => setActiveDialog("importBookmark")}
          onReorderGroups={reorderGroups}
        />
      }
    >
      <MainContent ref={mainContentRef}>
        {/* 搜索栏 */}
        <div className="flex justify-center mt-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 w-[540px] h-10 px-4 rounded-xl border border-border-strong bg-background hover:border-placeholder cursor-pointer transition-colors"
          >
            <Search size={16} className="text-placeholder" />
            <span className="text-base text-placeholder">搜索</span>
          </button>
        </div>

        {/* 轮播区 */}
        <CarouselBanner />

        {/* 书签列表 */}
        {groupsLoading || bookmarksLoading ? (
          <BookmarkListSkeleton />
        ) : (
          <BookmarkList
          groups={groups}
          getBookmarksByGroup={getBookmarksByGroup}
          sectionRefs={sectionRefs}
          onAddBookmark={(groupId) => {
            setDefaultGroupId(groupId)
            setActiveDialog("addBookmark")
          }}
          onEditBookmark={(bookmark) => {
            setSelectedBookmark(bookmark)
            setActiveDialog("editBookmark")
          }}
          onDeleteBookmark={(bookmark) => {
            setSelectedBookmark(bookmark)
            setActiveDialog("deleteBookmark")
          }}
          onEditGroup={(group) => {
            setSelectedGroup(group)
            setActiveDialog("editGroup")
          }}
          onDeleteGroup={(group) => {
            setSelectedGroup(group)
            setActiveDialog("deleteGroup")
          }}
          onExportGroup={handleExportGroup}
          />
        )}

        {/* 浮动按钮 */}
        <FloatingActions scrollContainerRef={mainContentRef} />

        {/* 搜索面板 */}
        <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />



        {/* 弹窗系统 */}
        <CreateGroupDialog
          open={activeDialog === "createGroup"}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          onConfirm={handleCreateGroup}
        />
        <EditGroupDialog
          open={activeDialog === "editGroup"}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          group={selectedGroup}
          onConfirm={handleEditGroup}
        />
        <AddBookmarkDialog
          open={activeDialog === "addBookmark"}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          groups={groups}
          defaultGroupId={defaultGroupId}
          onConfirm={handleAddBookmark}
        />
        <EditBookmarkDialog
          open={activeDialog === "editBookmark"}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          groups={groups}
          bookmark={selectedBookmark}
          onConfirm={handleEditBookmark}
        />
        <ImportBookmarkDialog
          open={activeDialog === "importBookmark"}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          onImported={() => {
            fetchGroups()
            fetchBookmarks()
          }}
        />
        <DeleteConfirmDialog
          open={activeDialog === "deleteGroup"}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          title="确定删除分组?"
          description="删除分组将同时删除该分组下的所有书签，此操作不可撤销。"
          onConfirm={handleDeleteGroup}
        />
        <DeleteConfirmDialog
          open={activeDialog === "deleteBookmark"}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          title="确定删除书签?"
          description="此操作不可撤销。"
          onConfirm={handleDeleteBookmark}
        />
      </MainContent>
    </AppLayout>
  )
}
