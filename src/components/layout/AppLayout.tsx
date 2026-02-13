import { ReactNode } from "react"

interface AppLayoutProps {
  sidebar: ReactNode
  children: ReactNode
}

export function AppLayout({ sidebar, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebar}
      {children}
    </div>
  )
}
