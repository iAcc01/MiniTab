import { useState, useCallback, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Bookmark } from "@/types"
import { searchExternal, ExternalSearchResult } from "@/lib/externalSearch"

export function useSearch() {
  const { dataProvider } = useAuth()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Bookmark[]>([])
  const [externalResults, setExternalResults] = useState<ExternalSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchingExternal, setIsSearchingExternal] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([])
        setExternalResults([])
        setIsEmpty(false)
        setIsSearching(false)
        setIsSearchingExternal(false)
        return
      }

      // 先进行站内搜索
      setIsSearching(true)
      setExternalResults([])
      setIsSearchingExternal(false)

      const data = await dataProvider.searchBookmarks(q.trim())
      setResults(data)
      setIsSearching(false)

      // 站内已搜到结果，不再进行外部搜索
      if (data.length > 0) {
        setIsEmpty(false)
        return
      }

      // 含非 ASCII 字符（汉字、日文、韩文等）不进行外部搜索
      if (/[^\x00-\x7F]/.test(q)) {
        setIsEmpty(true)
        return
      }

      // 站内无结果且为纯英文/数字/URL 字符，触发外部搜索
      setIsEmpty(true)
      setIsSearchingExternal(true)
      const external = await searchExternal(q.trim())
      setExternalResults(external)
      setIsSearchingExternal(false)
      if (external.length > 0) {
        setIsEmpty(false)
      }
    },
    [dataProvider]
  )

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      search(query)
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, search])

  const clearSearch = useCallback(() => {
    setQuery("")
    setResults([])
    setExternalResults([])
    setIsEmpty(false)
    setIsSearchingExternal(false)
  }, [])

  return {
    query,
    setQuery,
    results,
    externalResults,
    isSearching,
    isSearchingExternal,
    isEmpty,
    clearSearch,
  }
}
