import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookmarkGroup } from "@/types"
import { getFaviconUrl } from "@/hooks/useBookmarks"
import { fetchSiteDescription } from "@/lib/fetchSiteDescription"

interface AddBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: BookmarkGroup[]
  defaultGroupId?: string
  onConfirm: (data: {
    title: string
    url: string
    group_id: string
    description: string
    favicon_url: string
  }) => void
}

export function AddBookmarkDialog({
  open,
  onOpenChange,
  groups,
  defaultGroupId,
  onConfirm,
}: AddBookmarkDialogProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [groupId, setGroupId] = useState(defaultGroupId || "")
  const [description, setDescription] = useState("")
  const [fetchingDesc, setFetchingDesc] = useState(false)
  const descManuallyEdited = useRef(false)

  // 每次打开弹窗时清空表单
  useEffect(() => {
    if (open) {
      setTitle("")
      setUrl("")
      setGroupId(defaultGroupId || "")
      setDescription("")
      setFetchingDesc(false)
      descManuallyEdited.current = false
    }
  }, [open, defaultGroupId])

  useEffect(() => {
    if (!url.trim() || descManuallyEdited.current) return
    if (!url.startsWith("http")) return

    const timer = setTimeout(async () => {
      setFetchingDesc(true)
      try {
        const desc = await fetchSiteDescription(url.trim())
        if (desc && !descManuallyEdited.current) {
          setDescription(desc)
        }
      } catch {
        // ignore
      }
      setFetchingDesc(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [url])

  const handleConfirm = () => {
    if (!title.trim() || !url.trim() || !groupId) return
    let faviconUrl = ""
    if (url.startsWith("http")) {
      faviconUrl = getFaviconUrl(url)
    }
    onConfirm({
      title: title.trim(),
      url: url.trim(),
      group_id: groupId,
      description: description.trim(),
      favicon_url: faviconUrl,
    })
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setTitle("")
    setUrl("")
    setGroupId(defaultGroupId || "")
    setDescription("")
    descManuallyEdited.current = false
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[384px] pt-6 pb-8 px-8 rounded-xl bg-background border border-border overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-foreground">添加书签</DialogTitle>
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
            placeholder={fetchingDesc ? "正在获取网站简介…" : "简介（选填，自动获取）"}
            value={description}
            onChange={(e) => {
              descManuallyEdited.current = true
              setDescription(e.target.value)
            }}
            className="w-[320px] h-[68px] rounded-xl border-border-strong hover:border-placeholder focus:border-placeholder resize-none"
          />
        </div>
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
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
