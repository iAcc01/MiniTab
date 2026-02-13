export function BookmarkSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      {/* 分组标题骨架 */}
      <div className="h-6 w-32 bg-border-strong/40 rounded-md mb-4" />
      {/* 书签卡片网格骨架 */}
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-4 rounded-xl bg-muted"
          >
            <div className="w-10 h-10 rounded-xl bg-border-strong/40 flex-shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="h-4 w-24 bg-border-strong/40 rounded" />
              <div className="h-3 w-36 bg-border-strong/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BookmarkListSkeleton() {
  return (
    <div className="mt-12">
      <BookmarkSkeleton />
      <BookmarkSkeleton />
    </div>
  )
}
