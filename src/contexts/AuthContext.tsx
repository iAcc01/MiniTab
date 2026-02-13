import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { IDataProvider } from "@/types"
import { LocalStorageProvider } from "@/providers/LocalStorageProvider"
import { SupabaseProvider } from "@/providers/SupabaseProvider"
import { hasLocalUserData, migrateLocalDataToSupabase } from "@/providers/DataMigrationService"

interface AuthContextType {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  dataProvider: IDataProvider
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const localProvider = new LocalStorageProvider()

function translateError(msg: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "邮箱或密码错误",
    "Email not confirmed": "邮箱尚未验证，请检查收件箱",
    "User already registered": "该邮箱已注册",
    "Signup requires a valid password": "请输入有效的密码",
    "Password should be at least 6 characters": "密码至少需要 6 个字符",
    "Password should be at least 6 characters.": "密码至少需要 6 个字符",
    "Unable to validate email address: invalid format": "邮箱格式不正确",
    "Email rate limit exceeded": "操作过于频繁，请稍后再试",
    "For security purposes, you can only request this after 60 seconds.": "出于安全考虑，请 60 秒后再试",
    "Anonymous sign-ins are disabled": "匿名登录未启用",
    "Email logins are disabled": "邮箱登录未启用",
    "Signups not allowed for this instance": "当前不允许注册新账号",
    "Token has expired or is invalid": "会话已过期，请重新登录",
    "New password should be different from the old password.": "新密码不能与旧密码相同",
    "Auth session missing!": "登录会话丢失，请重新登录",
  }
  for (const [key, value] of Object.entries(map)) {
    if (msg.includes(key)) return value
  }
  return "操作失败，请稍后再试"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dataProvider, setDataProvider] = useState<IDataProvider>(localProvider)
  const initializedRef = useRef(false)

  useEffect(() => {
    let ignore = false

    const initAuth = async () => {
      // 获取当前 session
      const { data: { session: s } } = await supabase.auth.getSession()
      if (ignore) return

      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        setDataProvider(new SupabaseProvider(s.user.id))
      }
      setIsLoading(false)
      initializedRef.current = true
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      // 跳过初始会话恢复事件（已在 getSession 中处理）
      if (!initializedRef.current) return
      if (ignore) return

      setSession(s)
      setUser(s?.user ?? null)

      if (s?.user) {
        // 仅在 SIGNED_IN 事件（用户主动登录）时执行迁移
        if (event === "SIGNED_IN" && hasLocalUserData()) {
          try {
            await migrateLocalDataToSupabase(s.user.id)
          } catch (e) {
            console.error("Auto migration failed:", e)
          }
        }
        setDataProvider(new SupabaseProvider(s.user.id))
      } else {
        setDataProvider(localProvider)
      }
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: translateError(error.message) }
    return { error: null }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: translateError(error.message) }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setDataProvider(localProvider)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        dataProvider,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
