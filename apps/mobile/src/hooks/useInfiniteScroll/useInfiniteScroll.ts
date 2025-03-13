import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

type TUseInfiniteScrollData<J> = { results: J[]; prev?: string | null; next?: string | null }

type TUseInfiniteScrollConfig<T, J> = {
  refetch: () => void
  setPageUrl: (nextUrl?: string) => void
  data: (T & TUseInfiniteScrollData<J>) | undefined
}

export const useInfiniteScroll = <T, J>({ refetch, setPageUrl, data }: TUseInfiniteScrollConfig<T, J>) => {
  const activeSafe = useSelector(selectActiveSafe)
  const [list, setList] = useState<J[]>([])

  useEffect(() => {
    setList([])
  }, [activeSafe])

  useEffect(() => {
    if (!data?.results) {
      return
    }

    if (!data.prev) {
      setList(data.results)
      return
    }

    setList((prev) => (prev ? [...prev, ...data.results] : data.results))
  }, [data])

  const onEndReached = useCallback(() => {
    if (!data?.next) {
      return
    }

    setPageUrl(data.next)
    refetch()
  }, [data, refetch, setPageUrl])

  return { list, onEndReached }
}
