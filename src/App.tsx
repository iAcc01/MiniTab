import { BrowserRouter, useLocation, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { BookmarksPage } from "@/pages/BookmarksPage"
import { ExplorePage } from "@/pages/ExplorePage"
import { ToolsPage } from "@/pages/ToolsPage"
import { AppLayout } from "@/components/layout/AppLayout"
import { Sidebar } from "@/components/layout/Sidebar"
import { MainContent } from "@/components/layout/MainContent"
import { useGroups } from "@/hooks/useGroups"

function PlaceholderLayout({ children }: { children: React.ReactNode }) {
  const { groups } = useGroups()
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
      <MainContent>{children}</MainContent>
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
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
