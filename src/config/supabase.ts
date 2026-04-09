// Supabase 配置
// CRXJS 支持 import.meta.env，开发时 .env 文件仍然可用
// 构建时 Vite 会将 VITE_ 前缀的变量内联到代码中

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
}
