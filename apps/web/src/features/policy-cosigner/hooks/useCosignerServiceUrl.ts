import { resolveCosignerServiceUrl } from '@safe-global/utils/features/policy-cosigner/constants'
import { useAppSelector } from '@/store'
import { selectCosignerServiceUrls } from '@/store/settingsSlice'

/** The co-signer service for `chainId` from Settings › Environment variables, else the env; none means off */
export const useCosignerServiceUrl = (chainId: string | undefined): string | undefined =>
  resolveCosignerServiceUrl(chainId, useAppSelector(selectCosignerServiceUrls))
