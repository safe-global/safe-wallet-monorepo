import type { SafeTransaction } from '@safe-global/types-kit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import type { AppDispatch } from '@/store'
import { isPayFromSafeAvailable } from './isPayFromSafeAvailable'

export type PayFromSafeMergeContext = {
  safeTx: SafeTransaction
  chain: Chain | undefined
  feePaymentMode: 'safe' | 'signer' | undefined
  feeGasToken: string | undefined
  isFeePaymentEnabled: boolean
  chainId: string
  safeAddress: string
  numberSignatures: number
  currency?: string
  dispatch: AppDispatch
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
  isFeePaymentEnabled,
  chainId,
  safeAddress,
  numberSignatures,
  currency,
  dispatch,
}: PayFromSafeMergeContext): Promise<SafeTransaction> => {
  if (safeTx.signatures.size > 0) return safeTx
  if (!isPayFromSafeAvailable(chain)) return safeTx
  if (feePaymentMode !== 'safe' || !feeGasToken) return safeTx
  if (!isFeePaymentEnabled) return safeTx

  const { resolveFeeParams } = await import('../services/resolveFeeParams')
  return resolveFeeParams({
    chainId,
    safeAddress,
    safeTx,
    gasToken: feeGasToken,
    numberSignatures,
    currency,
    dispatch,
  })
}
