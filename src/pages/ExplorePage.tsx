import { Compass } from "lucide-react"

export function ExplorePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Compass size={48} className="text-muted-foreground" />
      <p className="text-xl text-muted-foreground">开发中</p>
    </div>
  )
}
