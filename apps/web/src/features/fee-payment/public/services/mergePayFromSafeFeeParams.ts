import type { SafeTransaction } from '@safe-global/types-kit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import type { AppDispatch } from '@/store'
import { isPayFromSafeAvailable } from '../utils/isPayFromSafeAvailable'

export type PayFromSafeMergeContext = {
  safeTx: SafeTransaction
  chain: Chain | undefined
  isPayFromSafe: boolean
  feeGasToken: string | undefined
  chainId: string
  safeAddress: string
  numberSignatures: number
  currency?: string
  dispatch: AppDispatch
}

export type PayFromSafeMerge = {
  safeTx: SafeTransaction
  feesMerged: boolean
}

/** Merges the CGW quote into an unsigned SafeTx; signed payloads keep their fee params. */
export const mergePayFromSafeFeeParams = async ({
  safeTx,
  chain,
  isPayFromSafe,
  feeGasToken,
  chainId,
  safeAddress,
  numberSignatures,
  currency,
  dispatch,
}: PayFromSafeMergeContext): Promise<PayFromSafeMerge> => {
  const unchanged = { safeTx, feesMerged: false }
  if (safeTx.signatures.size > 0) return unchanged
  if (!isPayFromSafeAvailable(chain)) return unchanged
  if (!isPayFromSafe || !feeGasToken) return unchanged

  const { resolveFeeParams } = await import('../../services/resolveFeeParams')
  const merged = await resolveFeeParams({
    chainId,
    safeAddress,
    safeTx,
    gasToken: feeGasToken,
    numberSignatures,
    currency,
    dispatch,
  })
  return { safeTx: merged, feesMerged: true }
}
