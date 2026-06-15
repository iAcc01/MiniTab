import { memo } from "react"
import { Bookmark as BookmarkIcon } from "lucide-react"
import { useFaviconLoader } from "@/hooks/useFaviconLoader"

interface FaviconImageProps {
  /** 优先尝试的图标 URL（用户保存的 favicon_url） */
  primaryUrl: string | null | undefined
  /** 网站 URL，用于推导 fallback 链 */
  siteUrl: string
  /** 包裹外层 className（控制尺寸/边距等） */
  className?: string
  /** <img> 自身的 className（控制图像填充模式） */
  imgClassName?: string
  /** 占位图 className（fallback 时显示的 BookmarkIcon） */
  placeholderClassName?: string
  alt?: string
}

/**
 * 通用 favicon 渲染组件：
 * - 内部使用 useFaviconLoader 完成多级 fallback、超时、跨域错误处理
 * - 加载失败 / 超时时退化为本地 BookmarkIcon 占位
 * - 状态变化平滑，不会因 onError 把元素 display:none 造成布局跳动
 */
export const FaviconImage = memo(function FaviconImage({
  primaryUrl,
  siteUrl,
  className = "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden",
  imgClassName = "w-6 h-6 object-contain",
  placeholderClassName = "w-5 h-5 text-muted-foreground",
  alt = "",
}: FaviconImageProps) {
  const { url, status, onImgError } = useFaviconLoader(primaryUrl, siteUrl)

  return (
    <div className={className}>
      {status === "loaded" && url ? (
        <img
          src={url}
          alt={alt}
          className={imgClassName}
          loading="lazy"
          onError={onImgError}
        />
      ) : (
        <BookmarkIcon className={placeholderClassName} />
      )}
    </div>
  )
})
