import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { FeePaymentContract } from './contract'

export const FeePaymentFeature = createFeatureHandle<FeePaymentContract>('fee-payment', FEATURES.GTF)

export type { FeePaymentContract } from './contract'
export { useFeesPreview } from './hooks/useFeesPreview'
export { usePayFromSafeFeePreview } from './hooks/usePayFromSafeFeePreview'
export { useIsFeeCardSlotVisible } from './hooks/useIsFeeCardSlotVisible'
export { useHistoryFeesBreakdown } from './hooks/useHistoryFeesBreakdown'
export { useResolvedGasToken } from './hooks/useResolvedGasToken'
export type { ResolvedGasTokenState, FeePreviewTx } from './hooks/useResolvedGasToken'
export { isPayFromSafeAvailable } from './utils/isPayFromSafeAvailable'
export { IS_RELAYING_LIVE } from './constants'
