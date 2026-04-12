import { createClient } from "@supabase/supabase-js"
import { SUPABASE_CONFIG } from "@/config/supabase"

if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  console.error("Missing Supabase environment variables")
}

// 自定义存储适配器，使用 chrome.storage.sync + local 双写
// sync: 数据同步到 Google 云端，卸载重装后可恢复（需 Chrome 登录 Google 账号）
// local: 日常高速读写，作为主存储
// 确保用户登录态在扩展关闭甚至卸载重装后依然保留
const chromeStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      // 优先从 sync 读取（卸载重装后仍然存在）
      if (chrome.storage.sync) {
        try {
          const syncResult = await chrome.storage.sync.get(key)
          if (syncResult[key] != null) {
            return syncResult[key] as string
          }
        } catch {
          // sync 不可用时 fallback 到 local
        }
      }
      // fallback: 从 local 读取
      if (chrome.storage.local) {
        const localResult = await chrome.storage.local.get(key)
        return (localResult[key] as string) ?? null
      }
    }
    return localStorage.getItem(key)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      // 同时写入 sync 和 local，sync 作为跨卸载的持久层
      if (chrome.storage.sync) {
        try {
          await chrome.storage.sync.set({ [key]: value })
        } catch {
          // sync 写入失败（可能超配额），忽略
        }
      }
      if (chrome.storage.local) {
        await chrome.storage.local.set({ [key]: value })
      }
    } else {
      localStorage.setItem(key, value)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      if (chrome.storage.sync) {
        try {
          await chrome.storage.sync.remove(key)
        } catch {
          // ignore
        }
      }
      if (chrome.storage.local) {
        await chrome.storage.local.remove(key)
      }
    } else {
      localStorage.removeItem(key)
    }
  },
}

export const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      storage: chromeStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
)
