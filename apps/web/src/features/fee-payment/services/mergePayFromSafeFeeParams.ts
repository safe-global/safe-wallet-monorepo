import type { SafeTransaction } from '@safe-global/types-kit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import type { AppDispatch } from '@/store'
import type { FeePaymentContract } from '../contract'
import { isPayFromSafeAvailable } from '../utils/isPayFromSafeAvailable'

type FeePaymentFeatureSurface = Pick<FeePaymentContract, 'resolveFeeParams'> & { $isReady: boolean }

export type PayFromSafeMergeContext = {
  safeTx: SafeTransaction
  chain: Chain | undefined
  feePaymentMode: 'safe' | 'signer' | undefined
  feeGasToken: string | undefined
  feePaymentFeature: FeePaymentFeatureSurface
  chainId: string
  safeAddress: string
  numberSignatures: number
  currency?: string
  dispatch: AppDispatch
}

/** Merges the CGW quote into an unsigned SafeTx; signed payloads keep their fee params. */
export const mergePayFromSafeFeeParams = async ({
  safeTx,
  chain,
  feePaymentMode,
  feeGasToken,
  feePaymentFeature,
  chainId,
  safeAddress,
  numberSignatures,
  currency,
  dispatch,
}: PayFromSafeMergeContext): Promise<SafeTransaction> => {
  if (safeTx.signatures.size > 0) return safeTx
  if (!isPayFromSafeAvailable(chain)) return safeTx
  if (feePaymentMode !== 'safe' || !feeGasToken) return safeTx
  if (!feePaymentFeature.$isReady || !feePaymentFeature.resolveFeeParams) return safeTx

  return feePaymentFeature.resolveFeeParams({
    chainId,
    safeAddress,
    safeTx,
    gasToken: feeGasToken,
    numberSignatures,
    currency,
    dispatch,
  })
}
