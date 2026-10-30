import type { FeatureHandle } from '@/features/__core__'
import type { PayFromSafeContract } from './contract'
import { useCurrentChain } from '@/hooks/useChains'

/**
 * Hand-rolled instead of `createFeatureHandle`: there is no feature flag. The module loads on any
 * chain once it is known, because the history shows the breakdown of a Safe-paid transaction even
 * where the relayer no longer offers Pay from Safe; callers check `useIsPayFromSafeEnabled` for the rest.
 */
const useIsPayFromSafeModuleEnabled = (): boolean | undefined => (useCurrentChain() ? true : undefined)

export const PayFromSafeFeature: FeatureHandle<PayFromSafeContract> = {
  name: 'pay-from-safe',
  useIsEnabled: useIsPayFromSafeModuleEnabled,
  load: () => import(/* webpackMode: "lazy" */ './feature'),
}

export { useIsPayFromSafeEnabled } from './hooks/useIsPayFromSafeEnabled'

export type { PayFromSafeContract } from './contract'
export { useFeesPreview } from './hooks/useFeesPreview'
export { usePayFromSafeFeePreview } from './hooks/usePayFromSafeFeePreview'
export { useIsPayFromSafeSlotVisible } from './hooks/useIsPayFromSafeSlotVisible'
export { useHistoryFeesBreakdown } from './hooks/useHistoryFeesBreakdown'
export { useResolvedGasToken } from './hooks/useResolvedGasToken'
export { useGasPayerSelection } from './hooks/useGasPayerSelection'
export type { GasPayerSelection } from './hooks/useGasPayerSelection'
export type { GasPayerChoice, FeePayerView, FeePayerPlanState, NetworkFee } from './types'
export type { ResolvedGasTokenState, FeePreviewTx } from './hooks/useResolvedGasToken'
export { isPayFromSafeAvailable } from './utils/isPayFromSafeAvailable'
