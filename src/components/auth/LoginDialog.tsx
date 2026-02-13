import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 切换模式时清空状态
  useEffect(() => {
    if (open) {
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setError(null)
      setIsSignUp(false)
    }
  }, [open])

  // ESC 键关闭弹窗
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isSignUp && password !== confirmPassword) {
      setError("两次输入的密码不一致")
      return
    }

    setLoading(true)
    const result = isSignUp ? await signUp(email, password) : await signIn(email, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      if (isSignUp) {
        setError(null)
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        // 注册成功后提示用户确认邮箱
        setError("注册成功！请检查邮箱确认后登录。")
        setIsSignUp(false)
      } else {
        onOpenChange(false)
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in-0 duration-200">
      {/* 左侧：登录/注册表单 */}
      <div className="w-[560px] h-full bg-background flex flex-col items-center justify-center flex-shrink-0 relative">
        <div className="w-[320px] flex flex-col items-center">
          {/* Logo */}
          <h1 className="font-logo text-[28px] font-bold text-foreground">Mini_Tab</h1>

          {/* 副标题 */}
          <p className="mt-[24px] text-sm text-muted-foreground">
            {isSignUp ? "创建账号以同步你的书签数据" : "请使用你的邮箱地址进行访问"}
          </p>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="w-full mt-[22px] flex flex-col gap-[16px]">
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 px-4 rounded-xl border border-border-strong bg-background text-sm text-foreground placeholder:text-placeholder outline-none hover:border-placeholder focus:border-placeholder transition-colors"
            />
            <input
              type="password"
              placeholder={isSignUp ? "设置 6-30 位密码" : "输入 6-30 位密码"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={30}
              className="w-full h-10 px-4 rounded-xl border border-border-strong bg-background text-sm text-foreground placeholder:text-placeholder outline-none hover:border-placeholder focus:border-placeholder transition-colors"
            />
            {isSignUp && (
              <input
                type="password"
                placeholder="确认密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                maxLength={30}
                className="w-full h-10 px-4 rounded-xl border border-border-strong bg-background text-sm text-foreground placeholder:text-placeholder outline-none hover:border-placeholder focus:border-placeholder transition-colors"
              />
            )}

            {error && (
              <p className={`text-sm ${error.includes("成功") ? "text-green-600" : "text-destructive"}`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer transition-opacity"
            >
              {loading ? "处理中..." : isSignUp ? "注册" : "登录"}
            </button>

            {/* 底部链接 */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                  setPassword("")
                  setConfirmPassword("")
                }}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                {isSignUp ? "已有账号登录" : "新用户注册"}
              </button>
              {!isSignUp && (
                <span className="text-sm text-muted-foreground">
                  忘记密码？
                </span>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 右侧：装饰区域 */}
      <div className="flex-1 h-full bg-muted flex items-center justify-center relative">
        <div className="w-[480px]">
          <p className="font-logo text-[50px] font-bold text-foreground leading-[1.25]">
            Run supabase locally and just wow in silence! I am impressed! This is the kind of tooling I would want for my team.
          </p>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-5 right-5 w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-secondary cursor-pointer transition-colors"
        >
          <X size={24} strokeWidth={1.5} className="text-foreground" />
        </button>
      </div>
    </div>
  )
}
