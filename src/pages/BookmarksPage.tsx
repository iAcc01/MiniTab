import { useState, useCallback, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import { BookmarkGroup, Bookmark, DialogType } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
import { useSidebar } from "@/contexts/SidebarContext"
import { useToast } from "@/contexts/ToastContext"
import { useGroups } from "@/hooks/useGroups"
import { useBookmarks } from "@/hooks/useBookmarks"
import { useBookmarkImport } from "@/hooks/useBookmarkImport"
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
  const [importing, setImporting] = useState(false)

  const { importBookmarks } = useBookmarkImport()

  const mainContentRef = useRef<HTMLElement>(null)
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const importSkeletonRef = useRef<HTMLDivElement>(null)
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

      // 如果容器还在顶部附近（未滚动到分组区域），不选中任何二级分组
      if (container.scrollTop < 80) {
        setActiveGroupId(null)
        return
      }

      const containerTop = container.getBoundingClientRect().top
      const threshold = containerTop + 200
      let activeId: string | null = null

      // 按 groups 顺序遍历，找最后一个顶部已滚过阈值线的分组
      for (const group of groups) {
        const el = sectionRefs.current.get(group.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= threshold) {
          activeId = group.id
        }
      }

      // 如果没有分组滚过阈值线，说明还在页面顶部区域，清除二级选中
      setActiveGroupId(activeId)
    }

    // 初始化时执行一次检测
    handleScroll()

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

  const handleImportStart = useCallback(
    async (parsedGroups: { name: string; bookmarks: { title: string; url: string; icon?: string }[] }[]) => {
      setImporting(true)
      // 等待骨架屏渲染后滚动到该位置
      setTimeout(() => {
        importSkeletonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
      await importBookmarks(parsedGroups)
      await fetchGroups()
      await fetchBookmarks()
      setImporting(false)
    },
    [importBookmarks, fetchGroups, fetchBookmarks]
  )

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
          <>
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
          {importing && (
            <div ref={importSkeletonRef} className="mb-8 animate-pulse">
              {/* 分组标题栏骨架 */}
              <div className="flex items-center justify-between mb-4 h-8">
                <div className="h-6 w-28 bg-border-strong/40 rounded-md" />
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 bg-border-strong/30 rounded" />
                </div>
              </div>
              {/* 书签卡片网格骨架 */}
              <div
                className="grid gap-6"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-4 rounded-[12px] bg-muted border border-transparent"
                  >
                    <div className="w-10 h-10 rounded-xl bg-border-strong/40 flex-shrink-0" />
                    <div className="flex flex-col flex-1 min-w-0 gap-1.5">
                      <div className="h-3.5 w-3/5 bg-border-strong/40 rounded" />
                      <div className="h-3 w-4/5 bg-border-strong/30 rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center py-4">
                <span className="text-sm text-muted-foreground">正在导入书签...</span>
              </div>
            </div>
          )}
          </>
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
          onImportStart={handleImportStart}
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
