import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Compass,
  Sparkles,
  Chrome,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useSidebar } from "@/contexts/SidebarContext"
import { BookmarkGroup } from "@/types"
import { GroupMenu } from "@/components/common/GroupMenu"
import { UserMenu } from "@/components/common/UserMenu"
import { LoginDialog } from "@/components/auth/LoginDialog"
import { DraggableGroupList } from "@/components/layout/DraggableGroupList"

interface SidebarProps {
  groups: BookmarkGroup[]
  onCreateGroup: () => void
  onImportBookmarks: () => void
  onReorderGroups?: (orderedIds: string[]) => void
}

export function Sidebar({ groups, onCreateGroup, onImportBookmarks, onReorderGroups }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, signOut } = useAuth()
  const {
    isCollapsed,
    toggleSidebar,
    activeNav,
    setActiveNav,
    activeGroupId,
    setActiveGroupId,
    scrollToGroupRef,
  } = useSidebar()

  const [showGroupMenu, setShowGroupMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const plusButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const path = location.pathname
    if (path.startsWith("/explore")) {
      setActiveNav("explore")
      setActiveGroupId(null)
    } else if (path.startsWith("/tools")) {
      setActiveNav("tools")
      setActiveGroupId(null)
    } else {
      setActiveNav("bookmarks")
    }
  }, [location.pathname, setActiveNav, setActiveGroupId])

  if (isCollapsed) {
    return (
      <>
        <button
          onClick={toggleSidebar}
          className="fixed top-[18px] left-[18px] z-30 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card-hover cursor-pointer transition-colors"
        >
          <PanelLeftOpen size={18} strokeWidth={1.5} className="text-text-hint" />
        </button>
        <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
      </>
    )
  }

  const navItems = [
    { id: "explore", label: "发现", icon: Compass, path: "/explore" },
    { id: "tools", label: "智能工具", icon: Sparkles, path: "/tools" },
    { id: "bookmarks", label: "我的书签", icon: Chrome, path: "/bookmarks" },
  ]

  return (
    <>
      <aside className="w-[220px] h-screen flex flex-col bg-background border-r-0 relative flex-shrink-0">
        {/* Logo区: left:12px top:16px, 收起按钮 left:176px top:8px */}
        <div className="flex items-center justify-between w-[196px] h-9 ml-[18px] mt-[18px]">
          <div className="pl-2 cursor-pointer" onClick={() => { window.location.href = "/bookmarks" }}>
            <h1 className="font-logo text-2xl font-bold text-foreground leading-none">Mini_Tab</h1>
          </div>
          <button
            onClick={toggleSidebar}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-card-hover cursor-pointer transition-colors"
          >
            <PanelLeftClose size={18} strokeWidth={1.5} className="text-text-hint" />
          </button>
        </div>

        {/* 导航区 */}
        <nav className="flex flex-col gap-3 px-3 mt-4">
          {navItems.map((item) => (
            <div key={item.id}>
              <div className="relative">
                <button
                  onClick={() => {
                    if (item.id === "bookmarks" && activeNav === "bookmarks") {
                      // 已在书签页，点击一级菜单回到顶部
                      setActiveGroupId(null)
                    }
                    setActiveNav(item.id)
                    navigate(item.path)
                  }}
                  className={cn(
                    "flex items-center w-[196px] h-9 pl-2 rounded-[8px] text-sm transition-colors cursor-pointer text-foreground",
                    activeNav === item.id
                      ? ""
                      : "hover:bg-card-hover",
                    activeNav === item.id &&
                      !(item.id === "bookmarks" && activeGroupId) &&
                      "bg-border"
                  )}
                >
                  <item.icon size={18} strokeWidth={1.5} className="flex-shrink-0 text-muted-foreground" />
                  <span className="ml-2">{item.label}</span>
                </button>
                {item.id === "bookmarks" && (
                  <button
                    ref={plusButtonRef}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isAuthenticated) {
                        setShowLoginDialog(true)
                      } else {
                        setShowGroupMenu(!showGroupMenu)
                      }
                    }}
                    className="absolute right-[6px] top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-border-strong cursor-pointer transition-colors"
                  >
                    <Plus size={16} strokeWidth={1.5} className="text-muted-foreground" />
                  </button>
                )}
              </div>
              {/* 二级菜单嵌套在"我的书签"下方 */}
              {item.id === "bookmarks" && activeNav === "bookmarks" && groups.length > 0 && (
                isAuthenticated && onReorderGroups ? (
                  <DraggableGroupList
                    groups={groups}
                    activeGroupId={activeGroupId}
                    onClickGroup={(groupId) => {
                      if (scrollToGroupRef.current) {
                        scrollToGroupRef.current(groupId)
                      } else {
                        setActiveGroupId(groupId)
                      }
                    }}
                    onReorder={onReorderGroups}
                  />
                ) : (
                  <div className="flex flex-col gap-3 mt-3 ml-[28px]">
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => {
                          if (scrollToGroupRef.current) {
                            scrollToGroupRef.current(group.id)
                          } else {
                            setActiveGroupId(group.id)
                          }
                        }}
                        className={cn(
                          "flex items-center h-9 pl-2 rounded-[8px] text-sm truncate transition-colors cursor-pointer text-foreground",
                          activeGroupId === group.id
                            ? "bg-border"
                            : "hover:bg-card-hover"
                        )}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          ))}
        </nav>

        {/* 加号浮出菜单 */}
        {showGroupMenu && (
          <GroupMenu
            onClose={() => setShowGroupMenu(false)}
            onCreateGroup={onCreateGroup}
            onImportBookmarks={onImportBookmarks}
            anchorRef={plusButtonRef}
          />
        )}

        <div className="flex-1" />

        {/* 底部用户区: left:12px top:956px */}
        <div className="px-3 pb-4 mt-auto relative">
          {isAuthenticated && user ? (
            <div className="flex items-center w-[196px] h-9 rounded-[8px]">
              <div className="w-[26px] h-[26px] rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium flex-shrink-0 ml-1">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-foreground truncate flex-1 ml-2">
                {user.email?.split("@")[0]}
              </span>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-[18px] h-[18px] flex items-center justify-center rounded hover:bg-card-hover cursor-pointer transition-colors mr-[9px]"
              >
                <MoreHorizontal size={18} className="text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginDialog(true)}
              className="w-[196px] h-9 rounded-[18px] bg-primary text-primary-foreground text-sm font-normal hover:opacity-90 cursor-pointer transition-opacity"
            >
              登录
            </button>
          )}
          {showUserMenu && (
            <UserMenu
              onClose={() => setShowUserMenu(false)}
              onSignOut={signOut}
            />
          )}
        </div>
      </aside>
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </>
  )
}
