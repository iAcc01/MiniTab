import { createClient } from "@supabase/supabase-js"
import { SUPABASE_CONFIG } from "@/config/supabase"

if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  console.error("Missing Supabase environment variables")
}

// 自定义存储适配器，使用 chrome.storage.local
// 确保用户登录态在扩展关闭后依然保留
const chromeStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const result = await chrome.storage.local.get(key)
      return (result[key] as string) ?? null
    }
    return localStorage.getItem(key)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({ [key]: value })
    } else {
      localStorage.setItem(key, value)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.remove(key)
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
