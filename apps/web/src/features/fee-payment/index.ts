import type { FeatureHandle } from '@/features/__core__'
import type { FeePaymentContract } from './contract'
import { useCurrentChain } from '@/hooks/useChains'

/**
 * Hand-rolled instead of `createFeatureHandle`: there is no feature flag. The module loads on any
 * chain once it is known, because the history shows the breakdown of a Safe-paid transaction even
 * where the relayer no longer offers Pay from Safe; callers check `useIsPayFromSafeEnabled` for the rest.
 */
const useIsFeePaymentModuleEnabled = (): boolean | undefined => (useCurrentChain() ? true : undefined)

export const FeePaymentFeature: FeatureHandle<FeePaymentContract> = {
  name: 'fee-payment',
  useIsEnabled: useIsFeePaymentModuleEnabled,
  load: () => import(/* webpackMode: "lazy" */ './feature'),
}

export { useIsPayFromSafeEnabled } from './hooks/useIsPayFromSafeEnabled'

export type { FeePaymentContract } from './contract'
export { useFeesPreview } from './hooks/useFeesPreview'
export { usePayFromSafeFeePreview } from './hooks/usePayFromSafeFeePreview'
export { useIsFeeCardSlotVisible } from './hooks/useIsFeeCardSlotVisible'
export { useHistoryFeesBreakdown } from './hooks/useHistoryFeesBreakdown'
export { useResolvedGasToken } from './hooks/useResolvedGasToken'
export { useGasPayerSelection } from './hooks/useGasPayerSelection'
export type { GasPayerSelection } from './hooks/useGasPayerSelection'
export type { GasPayerChoice, FeePayerView, FeePayerPlanState, NetworkFee } from './types'
export type { ResolvedGasTokenState, FeePreviewTx } from './hooks/useResolvedGasToken'
export { isPayFromSafeAvailable } from './utils/isPayFromSafeAvailable'
