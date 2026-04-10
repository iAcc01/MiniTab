import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sparkles,
  Bug,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  X,
} from "lucide-react"
import type { VersionInfo, ChangelogEntry } from "@/types"

interface UpdateNotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  latestVersion: VersionInfo
  currentVersion: string
  onUpdate: () => void
  onDismiss: () => void
}

const CHANGELOG_ICONS: Record<ChangelogEntry["type"], { icon: typeof Sparkles; color: string; label: string }> = {
  feature: { icon: Sparkles, color: "text-blue-500", label: "新功能" },
  fix: { icon: Bug, color: "text-orange-500", label: "修复" },
  improvement: { icon: Zap, color: "text-green-500", label: "优化" },
  breaking: { icon: AlertTriangle, color: "text-red-500", label: "重要变更" },
}

export function UpdateNotificationDialog({
  open,
  onOpenChange,
  latestVersion,
  currentVersion,
  onUpdate,
  onDismiss,
}: UpdateNotificationDialogProps) {
  const [changelogExpanded, setChangelogExpanded] = useState(true)

  // 按类型分组 changelog
  const groupedChangelog = latestVersion.changelog.reduce(
    (acc, entry) => {
      if (!acc[entry.type]) acc[entry.type] = []
      acc[entry.type].push(entry)
      return acc
    },
    {} as Record<string, ChangelogEntry[]>
  )

  // 显示顺序
  const typeOrder: ChangelogEntry["type"][] = ["breaking", "feature", "improvement", "fix"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] pt-6 pb-6 px-8 rounded-xl bg-background border border-border overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download size={18} className="text-primary" />
            </div>
            发现新版本
          </DialogTitle>
        </DialogHeader>

        {/* 版本号信息 */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">当前版本</span>
            <span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-mono font-medium text-foreground">
              v{currentVersion}
            </span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">最新版本</span>
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-xs font-mono font-medium text-primary">
              v{latestVersion.version}
            </span>
          </div>
        </div>

        {/* 发布日期 */}
        <p className="text-xs text-muted-foreground mt-1">
          发布于 {latestVersion.releaseDate}
        </p>

        {/* 更新日志 */}
        <div className="mt-3">
          <button
            onClick={() => setChangelogExpanded(!changelogExpanded)}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            更新日志
            {changelogExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {changelogExpanded && (
            <ScrollArea className="mt-2 max-h-[240px]">
              <div className="space-y-3 pr-3">
                {typeOrder.map((type) => {
                  const entries = groupedChangelog[type]
                  if (!entries || entries.length === 0) return null
                  const config = CHANGELOG_ICONS[type]
                  const Icon = config.icon

                  return (
                    <div key={type}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon size={13} className={config.color} />
                        <span className={`text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <ul className="space-y-1 ml-5">
                        {entries.map((entry, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground leading-relaxed relative before:content-['•'] before:absolute before:-left-3 before:text-border-strong"
                          >
                            {entry.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={onDismiss}
            className="flex-1 h-10 rounded-xl bg-secondary text-foreground border-0 hover:bg-border-strong cursor-pointer"
          >
            <X size={14} className="mr-1.5" />
            暂不更新
          </Button>
          <Button
            onClick={onUpdate}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
          >
            <Download size={14} className="mr-1.5" />
            前往下载
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
