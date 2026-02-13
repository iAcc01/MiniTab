import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookmarkGroup } from "@/types"

interface EditGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: BookmarkGroup | null
  onConfirm: (id: string, name: string) => void
}

export function EditGroupDialog({ open, onOpenChange, group, onConfirm }: EditGroupDialogProps) {
  const [name, setName] = useState("")

  useEffect(() => {
    if (group) setName(group.name)
  }, [group])

  const handleConfirm = () => {
    if (!name.trim() || !group) return
    onConfirm(group.id, name.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[360px] pt-6 pb-8 px-8 rounded-xl bg-background border border-border overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-foreground">编辑组名</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Input
            placeholder="请输入分组名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-[296px] h-10 rounded-xl border-border-strong hover:border-placeholder focus:border-placeholder"
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        </div>
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 rounded-xl bg-secondary text-foreground border-0 hover:bg-border-strong cursor-pointer"
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
