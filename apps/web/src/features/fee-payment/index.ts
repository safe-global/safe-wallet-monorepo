import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { FeePaymentContract } from './contract'

export const FeePaymentFeature = createFeatureHandle<FeePaymentContract>('fee-payment', FEATURES.GTF)

export type { FeePaymentContract } from './contract'

export type { ResolvedGasTokenState, FeePreviewTx } from './hooks/useResolvedGasToken'

export { IS_RELAYING_LIVE } from './constants'
