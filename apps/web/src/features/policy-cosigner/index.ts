import type { FeatureHandle } from '@/features/__core__'
import { useCurrentChain } from '@/hooks/useChains'
import type { PolicyCosignerContract } from './types'
import { useCosignerServiceUrl } from './hooks/useCosignerServiceUrl'

/**
 * Frontend-only gate, no CGW chain flag: on when the current chain has a co-signer service URL, set in
 * Settings › Environment variables or by `NEXT_PUBLIC_COSIGNER_SERVICE_URL` + `NEXT_PUBLIC_COSIGNER_CHAIN_IDS`.
 */
export const useIsPolicyCosignerEnabled = (): boolean => !!useCosignerServiceUrl(useCurrentChain()?.chainId)

export const PolicyCosignerFeature: FeatureHandle<PolicyCosignerContract> = {
  name: 'policy-cosigner',
  useIsEnabled: useIsPolicyCosignerEnabled,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: PolicyCosignerContract }>,
}

export type { PolicyCosignerContract, CosignerState } from './types'
export { useCosignerState } from './hooks/useCosignerState'
export { useCosignerServiceUrl } from './hooks/useCosignerServiceUrl'
