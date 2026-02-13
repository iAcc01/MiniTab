import { useToast, ToastType } from "@/contexts/ToastContext"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

const iconMap: Record<ToastType, { Icon: typeof CheckCircle2; color: string }> = {
  success: { Icon: CheckCircle2, color: "#1C1C1C" },
  warning: { Icon: AlertTriangle, color: "#D79443" },
  error: { Icon: XCircle, color: "#D79443" },
}

export function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 pointer-events-none">
      {toasts.map((toast) => {
        const { Icon, color } = iconMap[toast.type]
        return (
          <div
            key={toast.id}
            className="pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300 w-[240px] h-[50px] flex items-center gap-3 px-5 bg-white rounded-xl border border-border shadow-[0px_8px_16px_2px_rgba(0,0,0,0.06),0px_4px_16px_2px_rgba(0,0,0,0.04)]"
          >
            <Icon size={16} style={{ color }} className="flex-shrink-0" />
            <span
              className="text-xs font-normal truncate"
              style={{
                background: color,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {toast.message}
            </span>
          </div>
        )
      })}
    </div>
  )
}
