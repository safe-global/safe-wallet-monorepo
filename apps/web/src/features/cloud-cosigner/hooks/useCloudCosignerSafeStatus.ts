import useSafeInfo from '@/hooks/useSafeInfo'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { CLOUD_COSIGNER_URL } from '../constants'
import { useGetSafeCloudCosignerStatusQuery } from '../store/cloudCosignerApi'
import type { SafeCloudCosignerStatus } from '../types'

export type CloudCosignerSafeStatusState = {
  isAvailable: boolean
  status: SafeCloudCosignerStatus | undefined
  isLoading: boolean
  error: unknown
}

/** Enablement and effective policy of the cosigner for the current Safe. */
export const useCloudCosignerSafeStatus = (): CloudCosignerSafeStatusState => {
  const hasFeature = useHasFeature(FEATURES.CLOUD_COSIGNER)
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const isAvailable = hasFeature === true && CLOUD_COSIGNER_URL !== ''
  const canQuery = isAvailable && safeLoaded && !!safeAddress
  const { data, isLoading, error } = useGetSafeCloudCosignerStatusQuery(
    { chainId: safe.chainId, safeAddress },
    { skip: !canQuery },
  )

  return {
    isAvailable,
    status: data,
    isLoading: canQuery && isLoading,
    error,
  }
}
