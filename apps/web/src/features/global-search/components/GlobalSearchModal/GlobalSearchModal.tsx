import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch, useAppSelector } from '@/store'
import { closeGlobalSearch, selectGlobalSearchOpen } from '@/features/global-search/store'
import SearchSection from '../SearchSection/SearchSection'
import useSearchKeyboardNavigation from '../../hooks/useSearchKeyboardNavigation'
import { GlobalSearchModalView } from '@views/features/global-search/components/GlobalSearchModal/GlobalSearchModalView'

const GlobalSearchModal = () => {
  const [query, setQuery] = useState('')
  const open = useAppSelector(selectGlobalSearchOpen)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)

  const { onKeyDown } = useSearchKeyboardNavigation(scrollRef, query)

  const handleClose = useCallback(() => {
    dispatch(closeGlobalSearch())
    setQuery('')
  }, [dispatch])

  useEffect(() => {
    if (!open) return

    router.events.on('routeChangeStart', handleClose)

    return () => {
      router.events.off('routeChangeStart', handleClose)
    }
  }, [open, router.events, handleClose])

  if (!open) return null

  return (
    <GlobalSearchModalView
      query={query}
      onQueryChange={setQuery}
      onClose={handleClose}
      onKeyDown={onKeyDown}
      scrollRef={scrollRef}
      searchSection={<SearchSection query={query} />}
    />
  )
}

export default GlobalSearchModal
