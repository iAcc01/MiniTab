import { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { BookmarkGroup } from "@/types"

interface DraggableGroupListProps {
  groups: BookmarkGroup[]
  activeGroupId: string | null
  onClickGroup: (groupId: string) => void
  onReorder: (orderedIds: string[]) => void
}

export function DraggableGroupList({
  groups,
  activeGroupId,
  onClickGroup,
  onReorder,
}: DraggableGroupListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const dragNodeRef = useRef<HTMLButtonElement | null>(null)
  const itemsRef = useRef<Map<number, HTMLButtonElement>>(new Map())

  const getDisplayOrder = useCallback(() => {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      return groups.map((_, i) => i)
    }
    const order = groups.map((_, i) => i)
    const [removed] = order.splice(dragIndex, 1)
    order.splice(overIndex, 0, removed)
    return order
  }, [groups, dragIndex, overIndex])

  const handleDragStart = (e: React.DragEvent, index: number) => {
    const el = itemsRef.current.get(index)
    if (!el) return

    setDragIndex(index)
    setOverIndex(index)
    dragNodeRef.current = el

    // 设置自定义拖拽预览
    const ghost = el.cloneNode(true) as HTMLElement
    ghost.style.position = "fixed"
    ghost.style.top = "-1000px"
    ghost.style.width = `${el.offsetWidth}px`
    ghost.style.opacity = "0.9"
    ghost.style.borderRadius = "8px"
    ghost.style.backgroundColor = "var(--border)"
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    e.dataTransfer.effectAllowed = "move"

    requestAnimationFrame(() => {
      document.body.removeChild(ghost)
    })
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (dragIndex === null) return
    if (index !== overIndex) {
      setOverIndex(index)
    }
  }

  const handleDragEnd = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const order = getDisplayOrder()
      const orderedIds = order.map((i) => groups[i].id)
      onReorder(orderedIds)
    }
    setDragIndex(null)
    setOverIndex(null)
    dragNodeRef.current = null
  }

  const displayOrder = getDisplayOrder()

  return (
    <div className="flex flex-col gap-3 mt-3 ml-[28px]">
      {displayOrder.map((originalIndex, visualIndex) => {
        const group = groups[originalIndex]
        const isDragging = originalIndex === dragIndex
        const isShifting = dragIndex !== null && overIndex !== null && originalIndex !== dragIndex

        return (
          <button
            key={group.id}
            ref={(el) => {
              if (el) itemsRef.current.set(originalIndex, el)
              else itemsRef.current.delete(originalIndex)
            }}
            draggable
            onDragStart={(e) => handleDragStart(e, originalIndex)}
            onDragOver={(e) => handleDragOver(e, visualIndex)}
            onDragEnd={handleDragEnd}
            onClick={() => onClickGroup(group.id)}
            className={cn(
              "flex items-center h-9 pl-2 rounded-[8px] text-sm truncate cursor-pointer text-foreground select-none",
              "transition-all duration-200 ease-out",
              isDragging
                ? "opacity-40 scale-95"
                : "opacity-100 scale-100",
              isShifting && "transition-transform duration-200 ease-out",
              activeGroupId === group.id
                ? "bg-border"
                : "hover:bg-card-hover"
            )}
            style={{
              willChange: dragIndex !== null ? "transform, opacity" : "auto",
            }}
          >
            {group.name}
          </button>
        )
      })}
    </div>
  )
}
