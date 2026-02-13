import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onConfirm: () => void
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = "确定删除?",
  description = "此操作不可撤销",
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[360px] pt-6 pb-8 px-8 rounded-xl bg-background border border-border overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 rounded-xl bg-secondary text-foreground border-0 hover:bg-border-strong cursor-pointer"
          >
            取消
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 cursor-pointer"
          >
            确认删除
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
