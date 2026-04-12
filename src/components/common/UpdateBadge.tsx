import { Sparkles } from "lucide-react"

interface UpdateBadgeProps {
  onClick: () => void
}

export function UpdateBadge({ onClick }: UpdateBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e8f5e9] text-[#4caf50] text-sm font-medium hover:bg-[#c8e6c9] cursor-pointer transition-colors"
    >
      <Sparkles size={14} strokeWidth={2} />
      <span>新版本</span>
    </button>
  )
}
