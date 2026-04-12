/**
 * 默认书签数据（新用户初始化时使用）
 * LocalStorageProvider 和 SupabaseProvider 共享此数据源
 */

export const DEFAULT_GROUP_NAME = "热门网站"

export interface DefaultBookmarkData {
  title: string
  url: string
  description: string
  favicon_url: string
  sort_order: number
}

export const DEFAULT_BOOKMARKS_DATA: DefaultBookmarkData[] = [
  {
    title: "元宝",
    url: "https://yuanbao.tencent.com",
    description: "腾讯推出的 AI 智能助手",
    favicon_url: "https://www.google.com/s2/favicons?domain=yuanbao.tencent.com&sz=64",
    sort_order: 0,
  },
  {
    title: "ChatGPT",
    url: "https://chat.openai.com",
    description: "OpenAI 推出的 AI 对话助手",
    favicon_url: "https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64",
    sort_order: 1,
  },
  {
    title: "即梦",
    url: "https://jimeng.jianying.com",
    description: "字节跳动推出的 AI 创作平台",
    favicon_url: "https://www.google.com/s2/favicons?domain=jimeng.jianying.com&sz=64",
    sort_order: 2,
  },
  {
    title: "Gemini",
    url: "https://gemini.google.com",
    description: "Google 推出的多模态 AI 助手",
    favicon_url: "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64",
    sort_order: 3,
  },
  {
    title: "Pinterest",
    url: "https://www.pinterest.com",
    description: "全球创意灵感图片分享平台",
    favicon_url: "https://www.google.com/s2/favicons?domain=pinterest.com&sz=64",
    sort_order: 4,
  },
  {
    title: "Dribbble",
    url: "https://dribbble.com",
    description: "设计师作品展示与交流社区",
    favicon_url: "https://www.google.com/s2/favicons?domain=dribbble.com&sz=64",
    sort_order: 5,
  },
  {
    title: "Behance",
    url: "https://www.behance.net",
    description: "Adobe 旗下创意作品展示平台",
    favicon_url: "https://www.google.com/s2/favicons?domain=behance.net&sz=64",
    sort_order: 6,
  },
]
