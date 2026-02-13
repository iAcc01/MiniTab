import { Wrench } from "lucide-react"

export function ToolsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Wrench size={48} className="text-muted-foreground" />
      <p className="text-xl text-muted-foreground">开发中</p>
    </div>
  )
}
