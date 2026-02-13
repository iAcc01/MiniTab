import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileText } from "lucide-react"
import { useBookmarkImport } from "@/hooks/useBookmarkImport"

interface ParsedGroup {
  name: string
  bookmarks: { title: string; url: string; icon?: string }[]
}

interface ImportBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportStart: (groups: ParsedGroup[]) => void
}

export function ImportBookmarkDialog({ open, onOpenChange, onImportStart }: ImportBookmarkDialogProps) {
  const { parseBookmarkFile } = useBookmarkImport()
  const [parsedGroups, setParsedGroups] = useState<ParsedGroup[]>([])
  const [fileName, setFileName] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      const groups = parseBookmarkFile(content)
      setParsedGroups(groups)
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (parsedGroups.length === 0) return
    // 关闭弹窗，将解析数据传给父组件处理导入
    const groupsToImport = [...parsedGroups]
    setParsedGroups([])
    setFileName("")
    onOpenChange(false)
    onImportStart(groupsToImport)
  }

  const totalBookmarks = parsedGroups.reduce((sum, g) => sum + g.bookmarks.length, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] pt-6 pb-8 px-8 rounded-xl bg-background border border-border overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-foreground">导入书签</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <input
            ref={fileRef}
            type="file"
            accept=".html,.htm,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-border-strong rounded-xl flex flex-col items-center justify-center gap-2 hover:border-placeholder hover:bg-card-hover cursor-pointer transition-all"
          >
            <Upload size={32} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {fileName || "点击选择书签文件（.html / .json）"}
            </span>
          </button>

          {parsedGroups.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-foreground mb-2">
                解析到 {parsedGroups.length} 个分组，共 {totalBookmarks} 个书签
              </p>
              {parsedGroups.map((g, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground truncate">{g.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                    {g.bookmarks.length} 个书签
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setParsedGroups([])
              setFileName("")
              onOpenChange(false)
            }}
            className="flex-1 h-10 rounded-xl bg-secondary text-foreground border-0 hover:bg-border-strong cursor-pointer"
          >
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedGroups.length === 0}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            确认导入
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
