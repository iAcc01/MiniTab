import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookmarkGroup, Bookmark } from "@/types"
import { getFaviconUrl } from "@/hooks/useBookmarks"

interface EditBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: BookmarkGroup[]
  bookmark: Bookmark | null
  onConfirm: (id: string, data: Partial<Bookmark>) => void
}

export function EditBookmarkDialog({
  open,
  onOpenChange,
  groups,
  bookmark,
  onConfirm,
}: EditBookmarkDialogProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [groupId, setGroupId] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title)
      setUrl(bookmark.url)
      setGroupId(bookmark.group_id)
      setDescription(bookmark.description || "")
    }
  }, [bookmark])

  const handleConfirm = () => {
    if (!title.trim() || !url.trim() || !groupId || !bookmark) return
    let faviconUrl = bookmark.favicon_url || ""
    if (url !== bookmark.url && url.startsWith("http")) {
      faviconUrl = getFaviconUrl(url)
    }
    onConfirm(bookmark.id, {
      title: title.trim(),
      url: url.trim(),
      group_id: groupId,
      description: description.trim(),
      favicon_url: faviconUrl,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[384px] pt-6 pb-8 px-8 rounded-xl bg-background border border-border overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-foreground">编辑书签</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-3">
          <Input
            placeholder="名称"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-[320px] h-10 rounded-xl border-border-strong hover:border-placeholder focus:border-placeholder"
          />
          <Input
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-[320px] h-10 rounded-xl border-border-strong hover:border-placeholder focus:border-placeholder"
          />
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger className="w-[320px] h-10 rounded-xl border-border-strong hover:border-placeholder">
              <SelectValue placeholder="选择分组" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="简介（选填）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-[320px] h-[68px] rounded-xl border-border-strong hover:border-placeholder focus:border-placeholder resize-none"
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
            disabled={!title.trim() || !url.trim() || !groupId}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
