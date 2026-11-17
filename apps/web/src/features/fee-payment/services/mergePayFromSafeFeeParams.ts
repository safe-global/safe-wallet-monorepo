import type { SafeTransaction } from '@safe-global/types-kit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import type { AppDispatch } from '@/store'
import type { FeePaymentContract } from '../contract'
import { isPayFromSafeAvailable } from '../utils/isPayFromSafeAvailable'
import { isKnownPolicyGuard } from '@safe-global/utils/features/policy-guard/constants'

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
  guard?: string | null
}

/**
 * Merge CGW fee-preview fee fields into a SafeTx before the first signer signs.
 * Confirmers inherit the locked fields from the signed payload — bails out if signatures exist.
 */
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
  guard,
}: PayFromSafeMergeContext): Promise<SafeTransaction> => {
  if (safeTx.signatures.size > 0) return safeTx
  // A policy guard rejects a non-zero gasPrice, and a co-signature only covers zero gas fields
  if (isKnownPolicyGuard(guard)) return safeTx
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
