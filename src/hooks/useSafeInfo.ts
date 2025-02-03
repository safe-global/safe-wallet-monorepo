import { useMemo, useEffect } from 'react'
import isEqual from 'lodash/isEqual'
import { useAppSelector, useAppDispatch } from '@/store'
import { defaultSafeInfo, type ExtendedSafeInfo, selectSafeInfo } from '@/store/safeInfoSlice'
import { useQueryClient } from '@tanstack/react-query'
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

  useEffect(() => {
    if (data) {
      const prefetchBadges = async () => {
        try {
          console.log('Prefetching badges')
          await queryClient.ensureQueryData({
            queryKey: ['badges', result.safeAddress, result.safeLoaded],
            queryFn: () => badgesService.getBadges(result.safeAddress as `0x${string}`),
          })



        } catch (error) {
          console.error('Error during call:', error)
        }
      }
      if (data.address.value !== lastAddress && lastStatus != result.safeLoaded) {
        lastAddress = data.address.value;
        lastStatus = result.safeLoaded;
        if (lastAddress && lastAddress != '')
          prefetchBadges()
      }

    }
  }, [data, dispatch])

  return result
}
var lastAddress: String | undefined = undefined;
var lastStatus: boolean | undefined = undefined;
export default useSafeInfo