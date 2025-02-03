import { useMemo } from 'react'
import isEqual from 'lodash/isEqual'
import { useAppSelector } from '@/store'
import { defaultSafeInfo, type ExtendedSafeInfo, selectSafeInfo } from '@/store/safeInfoSlice'
import { useQuery } from '@tanstack/react-query'
import badgesService from '@/features/superChain/services/badges.service'

const useSafeInfo = (): {
  safe: ExtendedSafeInfo
  safeAddress: string
  safeLoaded: boolean
  safeLoading: boolean
  safeError?: string
} => {
  const { data, error, loading } = useAppSelector(selectSafeInfo, isEqual)

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
    queryKey: ['badges', result.safeAddress, result.safeLoaded],
    queryFn: () => badgesService.getBadges(result.safeAddress as `0x${string}`),
    enabled: !!result.safeAddress && !!result.safeLoaded,
  })

  return result
}
export default useSafeInfo
