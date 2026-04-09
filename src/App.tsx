import { BrowserRouter, MemoryRouter, useLocation, useNavigate } from "react-router-dom"
import { useEffect, useRef } from "react"

// 检测是否运行在 Chrome 扩展环境中
const isChromeExtension =
  typeof chrome !== "undefined" &&
  typeof chrome.runtime !== "undefined" &&
  typeof chrome.runtime.id !== "undefined"
import { BookmarksPage } from "@/pages/BookmarksPage"
import { ExplorePage } from "@/pages/ExplorePage"
import { ToolsPage } from "@/pages/ToolsPage"
import { AppLayout } from "@/components/layout/AppLayout"
import { Sidebar } from "@/components/layout/Sidebar"
import { MainContent } from "@/components/layout/MainContent"
import { FloatingActions } from "@/components/common/FloatingActions"
import { useGroups } from "@/hooks/useGroups"

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
    if (currentPath !== "/bookmarks" && currentPath !== "/explore" && currentPath !== "/tools") {
      navigate("/bookmarks", { replace: true })
    }
  }, [currentPath, navigate])

  const isBookmarks = currentPath === "/bookmarks" || (currentPath !== "/explore" && currentPath !== "/tools")
  const isExplore = currentPath === "/explore"
  const isTools = currentPath === "/tools"

  return (
    <>
      <div style={{ display: isBookmarks ? "contents" : "none" }}>
        <BookmarksPage />
      </div>
      <div style={{ display: isExplore ? "contents" : "none" }}>
        <PlaceholderLayout>
          <ExplorePage />
        </PlaceholderLayout>
      </div>
      <div style={{ display: isTools ? "contents" : "none" }}>
        <PlaceholderLayout>
          <ToolsPage />
        </PlaceholderLayout>
      </div>
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
