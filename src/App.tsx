import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route
          path="/explore"
          element={
            <PlaceholderLayout>
              <ExplorePage />
            </PlaceholderLayout>
          }
        />
        <Route
          path="/tools"
          element={
            <PlaceholderLayout>
              <ToolsPage />
            </PlaceholderLayout>
          }
        />
        <Route path="*" element={<Navigate to="/bookmarks" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
