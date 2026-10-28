import type { FeatureHandle } from '@/features/__core__'
import type { PayFromSafeContract } from './contract'
import { useIsPayFromSafeEnabled } from './hooks/useIsPayFromSafeEnabled'

// Hand-rolled instead of `createFeatureHandle`: the flag is read through `useIsPayFromSafeEnabled`,
// which accepts both the new `PAY_FROM_SAFE` name and the legacy `GTF` one.
export const PayFromSafeFeature: FeatureHandle<PayFromSafeContract> = {
  name: 'pay-from-safe',
  useIsEnabled: useIsPayFromSafeEnabled,
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
export { IS_RELAYING_LIVE } from './constants'
