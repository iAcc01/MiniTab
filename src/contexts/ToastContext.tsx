import { createContext, useContext, useState, useCallback, ReactNode } from "react"

export type ToastType = "success" | "warning" | "error"

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastContextType {
  toasts: ToastItem[]
  showToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}
