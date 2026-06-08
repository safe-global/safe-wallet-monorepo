import type { SafeTransaction } from '@safe-global/types-kit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

import type { AppDispatch } from '@/store'
import type { GTFContract } from '../contract'

type GtfFeatureSurface = Pick<GTFContract, 'resolveFeeParams'> & { $isReady: boolean }

export type GtfMergeContext = {
  safeTx: SafeTransaction
  chain: Chain | undefined
  gtfPaymentMode: 'safe' | 'signer' | undefined
  gtfSelectedGasToken: string | undefined
  gtfFeature: GtfFeatureSurface
  chainId: string
  safeAddress: string
  numberSignatures: number
  dispatch: AppDispatch
}

/**
 * Merge CGW fee-preview fee fields into a SafeTx before the first signer signs.
 * Confirmers inherit the locked fields from the signed payload — bails out if signatures exist.
 */
export const mergeGtfFeeParams = async ({
  safeTx,
  chain,
  gtfPaymentMode,
  gtfSelectedGasToken,
  gtfFeature,
  chainId,
  safeAddress,
  numberSignatures,
  dispatch,
}: GtfMergeContext): Promise<SafeTransaction> => {
  if (safeTx.signatures.size > 0) return safeTx
  if (!chain || !hasFeature(chain, FEATURES.GTF)) return safeTx
  if (gtfPaymentMode !== 'safe' || !gtfSelectedGasToken) return safeTx
  if (!gtfFeature.$isReady || !gtfFeature.resolveFeeParams) return safeTx

  return gtfFeature.resolveFeeParams({
    chainId,
    safeAddress,
    safeTx,
    gasToken: gtfSelectedGasToken,
    numberSignatures,
    dispatch,
  })
}
