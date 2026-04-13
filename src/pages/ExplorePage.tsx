import { useState } from "react"
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Flame,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useExploreData } from "@/hooks/useExploreData"
import type { ExploreCategory, HotSite } from "@/lib/exploreService"

// ==================== 子组件 ====================

/** 分类网站卡片 */
function SiteCard({ name, url, description, favicon }: {
  name: string
  url: string
  description: string
  favicon: string
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-card-hover border border-transparent hover:border-border transition-all duration-200 group cursor-pointer"
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-background">
        {!imgError ? (
          <img
            src={favicon}
            alt=""
            className="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-sm">🔗</span>
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground truncate">{name}</span>
        <span className="text-xs text-muted-foreground truncate">{description}</span>
      </div>
      <ExternalLink size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </a>
  )
}

/** 分类区块 */
function CategorySection({ category }: { category: ExploreCategory }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 mb-3 w-full group cursor-pointer"
      >
        <span className="text-lg">{category.icon}</span>
        <h3 className="text-base font-semibold text-foreground">{category.name}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {category.sites.length}
        </span>
        <div className="flex-1" />
        {expanded ? (
          <ChevronUp size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
      {expanded && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
          {category.sites.map((site) => (
            <SiteCard key={site.url} {...site} />
          ))}
        </div>
      )}
    </div>
  )
}

/** 趋势图标 */
function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  switch (trend) {
    case "up":
      return <TrendingUp size={14} className="text-green-500" />
    case "down":
      return <TrendingDown size={14} className="text-red-400" />
    default:
      return <Minus size={14} className="text-muted-foreground" />
  }
}

/** 热度条 */
function HeatBar({ heat }: { heat: number }) {
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${heat}%`,
          background: heat > 80
            ? "linear-gradient(90deg, #f97316, #ef4444)"
            : heat > 50
            ? "linear-gradient(90deg, #3b82f6, #6366f1)"
            : "linear-gradient(90deg, #94a3b8, #64748b)",
        }}
      />
    </div>
  )
}

/** 排行榜项 */
function RankItem({ site }: { site: HotSite }) {
  const [imgError, setImgError] = useState(false)

  const rankColor =
    site.rank === 1
      ? "bg-amber-500 text-white"
      : site.rank === 2
      ? "bg-gray-400 text-white"
      : site.rank === 3
      ? "bg-amber-700 text-white"
      : "bg-muted text-muted-foreground"

  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 py-2.5 px-2 rounded-lg hover:bg-muted transition-colors group cursor-pointer"
    >
      <span className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center flex-shrink-0 ${rankColor}`}>
        {site.rank}
      </span>
      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
        {!imgError ? (
          <img
            src={site.favicon}
            alt=""
            className="w-5 h-5 object-contain"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-xs">🔗</span>
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">{site.name}</span>
          <TrendIcon trend={site.trend} />
        </div>
        <HeatBar heat={site.heat} />
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">{site.heat}</span>
    </a>
  )
}

/** 排行榜卡片 */
function RankCard({ title, icon, sites }: {
  title: string
  icon: React.ReactNode
  sites: HotSite[]
}) {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? sites : sites.slice(0, 5)

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="flex flex-col">
        {displayed.map((site) => (
          <RankItem key={site.url + site.rank} site={site} />
        ))}
      </div>
      {sites.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          {showAll ? (
            <>收起 <ChevronUp size={12} /></>
          ) : (
            <>查看更多 <ChevronDown size={12} /></>
          )}
        </button>
      )}
    </div>
  )
}

/** 骨架屏 */
function ExploreSkeleton() {
  return (
    <div className="flex gap-6 animate-pulse">
      {/* 左栏骨架 */}
      <div className="flex-[2] min-w-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-6">
            <div className="h-6 w-32 bg-border-strong/40 rounded mb-3" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                  <div className="w-9 h-9 rounded-lg bg-border-strong/40" />
                  <div className="flex flex-col flex-1 gap-1.5">
                    <div className="h-3.5 w-20 bg-border-strong/40 rounded" />
                    <div className="h-3 w-36 bg-border-strong/30 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* 右栏骨架 */}
      <div className="flex-[1] min-w-0">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4 mb-4">
            <div className="h-5 w-28 bg-border-strong/40 rounded mb-3" />
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="flex items-center gap-2.5 py-2.5">
                <div className="w-5 h-5 rounded bg-border-strong/40" />
                <div className="w-6 h-6 rounded bg-border-strong/30" />
                <div className="flex-1">
                  <div className="h-3.5 w-20 bg-border-strong/40 rounded mb-1.5" />
                  <div className="h-1.5 w-full bg-border-strong/30 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== 主组件 ====================

export function ExplorePage() {
  const { data, loading, refreshing, refresh } = useExploreData()

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const h = d.getHours().toString().padStart(2, "0")
    const m = d.getMinutes().toString().padStart(2, "0")
    return `${d.getMonth() + 1}/${d.getDate()} ${h}:${m}`
  }

  if (loading && !data) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">发现</h2>
        </div>
        <ExploreSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">数据加载失败</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm cursor-pointer hover:opacity-90"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="py-4">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">发现</h2>
          <p className="text-xs text-muted-foreground mt-0.5">精选网站推荐与热度排行</p>
        </div>
        <div className="flex items-center gap-3">
          {data.lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} />
              <span>更新于 {formatTime(data.lastUpdated)}</span>
            </div>
          )}
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "刷新中…" : "刷新"}
          </button>
        </div>
      </div>

      {/* 两栏布局：左 2 : 右 1 */}
      <div className="flex gap-6">
        {/* 左栏：分类网站推荐 */}
        <div className="flex-[2] min-w-0">
          {data.categories.map((category) => (
            <CategorySection key={category.id} category={category} />
          ))}
        </div>

        {/* 右栏：排行榜 */}
        <div className="flex-[1] min-w-0 space-y-4">
          {/* 综合热度排行 */}
          <RankCard
            title="综合热度排行"
            icon={<Flame size={16} className="text-orange-500" />}
            sites={data.hotSites}
          />

          {/* AI 热度排行 */}
          <RankCard
            title="AI 智能热度排行"
            icon={<Sparkles size={16} className="text-purple-500" />}
            sites={data.aiHotSites}
          />
        </div>
      </div>
    </div>
  )
}
