import type { FeatureHandle } from '@/features/__core__'
import type { GTFContract } from './contract'
import { useIsPayFromSafeEnabled } from './hooks/useIsPayFromSafeEnabled'

// Hand-rolled instead of `createFeatureHandle`: the flag is read through `useIsPayFromSafeEnabled`,
// which accepts both the new `PAY_FROM_SAFE` name and the legacy `GTF` one.
export const GTFFeature: FeatureHandle<GTFContract> = {
  name: 'gtf',
  useIsEnabled: useIsPayFromSafeEnabled,
  load: () => import(/* webpackMode: "lazy" */ './feature'),
}

export { useIsPayFromSafeEnabled } from './hooks/useIsPayFromSafeEnabled'

export type { GTFContract } from './contract'
export { useFeesPreview } from './hooks/useFeesPreview'
export { useGtfFeePreview } from './hooks/useGtfFeePreview'
export { useIsGtfSlotVisible } from './hooks/useIsGtfSlotVisible'
export { useHistoryFeesBreakdown } from './hooks/useHistoryFeesBreakdown'
export { useResolvedGasToken } from './hooks/useResolvedGasToken'
export { useGasPayerSelection } from './hooks/useGasPayerSelection'
export type { GasPayerSelection } from './hooks/useGasPayerSelection'
export type { GasPayerChoice, FeePayerView, FeePayerPlanState, NetworkFee } from './types'
export { useIsPayFromSafeSignAndExecute } from './hooks/useIsPayFromSafeSignAndExecute'
export type { ResolvedGasTokenState, FeePreviewTx } from './hooks/useResolvedGasToken'
export { isGtfFeePreviewAvailable } from './utils/isGtfFeePreviewAvailable'
export { IS_RELAYING_LIVE } from './constants'
