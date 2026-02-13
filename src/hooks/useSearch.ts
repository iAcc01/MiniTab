import { useState, useCallback, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Bookmark } from "@/types"

export function useSearch() {
  const { dataProvider } = useAuth()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Bookmark[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([])
        setIsEmpty(false)
        setIsSearching(false)
        return
      }
      setIsSearching(true)
      const data = await dataProvider.searchBookmarks(q.trim())
      setResults(data)
      setIsEmpty(data.length === 0)
      setIsSearching(false)
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

  const clearSearch = () => {
    setQuery("")
    setResults([])
    setIsEmpty(false)
  }

  return { query, setQuery, results, isSearching, isEmpty, clearSearch }
}
