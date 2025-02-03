import { useMemo, useEffect } from 'react'
import isEqual from 'lodash/isEqual'
import { useAppSelector, useAppDispatch } from '@/store'
import { defaultSafeInfo, type ExtendedSafeInfo, selectSafeInfo } from '@/store/safeInfoSlice'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import badgesService from '@/features/superChain/services/badges.service'




const useSafeInfo = (): {
  safe: ExtendedSafeInfo
  safeAddress: string
  safeLoaded: boolean
  safeLoading: boolean
  safeError?: string
} => {
  const dispatch = useAppDispatch()
  const { data, error, loading } = useAppSelector(selectSafeInfo, isEqual)
  const queryClient = useQueryClient()

  const result = useMemo(
    () => ({
      safe: data || defaultSafeInfo,
      safeAddress: data?.address.value || '',
      safeLoaded: !!data,
      safeError: error,
      safeLoading: loading,
    }),
    [data, error, loading],

  )


  useQuery({
    queryKey: ['safeInfo', result.safeAddress, result.safeLoaded],
    queryFn: () => badgesService.getBadges(result.safeAddress as `0x${string}`),
    enabled: !!result.safeAddress && !!result.safeLoaded,
  })

  return result
}
export default useSafeInfo