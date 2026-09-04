import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { CLOUD_COSIGNER_URL } from '../constants'
import { useGetCloudCosignerInfoQuery } from '../store/cloudCosignerApi'
import type { CloudCosignerPolicy } from '../types'

export type CloudCosignerInfoState = {
  /** Chain feature flag on and a service URL configured. */
  isAvailable: boolean
  address: string | undefined
  defaultPolicy: CloudCosignerPolicy | undefined
  isLoading: boolean
  error: unknown
}

/**
 * The cosigner address to add as a Safe owner. Skips the request entirely when the feature is
 * off for the current chain or no service URL is configured.
 */
export const useCloudCosignerInfo = (): CloudCosignerInfoState => {
  const hasFeature = useHasFeature(FEATURES.CLOUD_COSIGNER)
  const isAvailable = hasFeature === true && CLOUD_COSIGNER_URL !== ''
  const { data, isLoading, error } = useGetCloudCosignerInfoQuery(undefined, { skip: !isAvailable })

  return {
    isAvailable,
    address: data?.address,
    defaultPolicy: data?.defaultPolicy,
    isLoading: isAvailable && isLoading,
    error,
  }
}
