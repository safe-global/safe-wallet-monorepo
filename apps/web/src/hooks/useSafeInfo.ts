import { useMemo } from 'react'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { useSafeAddressFromUrl } from './useSafeAddressFromUrl'
import { useChainId } from './useChainId'
import { getRtkQueryErrorMessage } from '@/utils/rtkQueryError'

const useSafeInfo = (): {
  safe: ExtendedSafeInfo
  safeAddress: string
  safeLoaded: boolean
  safeLoading: boolean
  safeError?: string
} => {
  const safeAddress = useSafeAddressFromUrl()
  const chainId = useChainId()

  const { currentData, error, isLoading } = useSafesGetSafeV1Query(
    { chainId: chainId || '', safeAddress: safeAddress || '' },
    { skip: !chainId || !safeAddress },
  )

  return useMemo(
    () => ({
      safe: currentData ? { ...currentData, deployed: true } : defaultSafeInfo,
      safeAddress: currentData?.address.value || '',
      safeLoaded: !!currentData && !isLoading,
      safeError: getRtkQueryErrorMessage(error, 'Failed to load Safe'),
      safeLoading: isLoading,
    }),
    [currentData, error, isLoading],
  )
}

export default useSafeInfo
