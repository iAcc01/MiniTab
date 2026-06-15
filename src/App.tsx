import { BrowserRouter, MemoryRouter, useLocation, useNavigate } from "react-router-dom"
import { useEffect, useRef, lazy, Suspense } from "react"

// 检测是否运行在 Chrome 扩展环境中
const isChromeExtension =
  typeof chrome !== "undefined" &&
  typeof chrome.runtime !== "undefined" &&
  typeof chrome.runtime.id !== "undefined"
import { BookmarksPage } from "@/pages/BookmarksPage"
import { AppLayout } from "@/components/layout/AppLayout"
import { Sidebar } from "@/components/layout/Sidebar"
import { MainContent } from "@/components/layout/MainContent"
import { FloatingActions } from "@/components/common/FloatingActions"
import { useGroups } from "@/hooks/useGroups"

// 懒加载 ExplorePage，减少首屏 JS 解析量
const ExplorePage = lazy(() =>
  import("@/pages/ExplorePage").then((m) => ({ default: m.ExplorePage }))
)

function PlaceholderLayout({ children }: { children: React.ReactNode }) {
  const { groups } = useGroups()
  const mainContentRef = useRef<HTMLDivElement>(null)
  return (
    <AppLayout
      sidebar={
        <Sidebar
          groups={groups}
          onCreateGroup={() => {}}
          onImportBookmarks={() => {}}
        />
      }
    >
      <MainContent ref={mainContentRef}>
        {children}
        <FloatingActions scrollContainerRef={mainContentRef} />
      </MainContent>
    </AppLayout>
  )
}

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname

  useEffect(() => {
    if (currentPath !== "/bookmarks" && currentPath !== "/explore") {
      navigate("/bookmarks", { replace: true })
    }
  }, [currentPath, navigate])

  const isExplore = currentPath === "/explore"
  const isBookmarks = !isExplore

  return (
    <>
      {isBookmarks && <BookmarksPage />}
      {isExplore && (
        <PlaceholderLayout>
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-muted-foreground text-sm">加载中...</div></div>}>
            <ExplorePage />
          </Suspense>
        </PlaceholderLayout>
      )}
    </>
  )
}

function App() {
  const Router = isChromeExtension ? MemoryRouter : BrowserRouter
  return (
    <Router {...(isChromeExtension ? { initialEntries: ["/bookmarks"] } : {})}>
      <AppShell />
    </Router>
  )
}

export default App
