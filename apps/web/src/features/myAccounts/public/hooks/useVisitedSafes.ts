import { useRouter } from 'next/router'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppDispatch } from '@/store'
import { useCallback, useEffect } from 'react'
import { upsertVisitedSafe } from '@/store/visitedSafesSlice'

export const useVisitedSafes = () => {
  const router = useRouter()
  const { safe } = useSafeInfo()
  const dispatch = useAppDispatch()

  const handleRouteChange = useCallback(() => {
    const { query } = router
    if (query.safe && safe.address.value) {
      const visitedSafe = {
        chainId: safe.chainId,
        address: safe.address.value,
        lastVisited: Date.now(),
      }
      dispatch(upsertVisitedSafe(visitedSafe))
    }
  }, [router, safe.address.value, safe.chainId, dispatch])

  useEffect(() => {
    if (router.query.safe) {
      handleRouteChange()
    }
  }, [handleRouteChange, router.query.safe])
}
