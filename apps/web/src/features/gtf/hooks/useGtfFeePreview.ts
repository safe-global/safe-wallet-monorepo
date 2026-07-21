import { skipToken } from '@reduxjs/toolkit/query'
import type { SafeTransaction } from '@safe-global/types-kit'

import { useGetGtfFeePreviewQuery } from '@/store/api/gateway'
import { toSupportedFiatCode } from '@/store/api/gateway/gtfFeePreview'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useCurrentChain } from '@/hooks/useChains'
import { isGtfFeePreviewAvailable } from '../utils/isGtfFeePreviewAvailable'

type Args = {
  enabled: boolean
  safeTx: SafeTransaction | undefined
  chainId: string | undefined
  safeAddress: string | undefined
  gasToken: string | undefined
  numberSignatures: number
}

/**
 * Thin wrapper around `useGetGtfFeePreviewQuery` that centralises the arg shape and the
 * eligibility gate. RTK Query dedupes identical args across consumers, so calling this from
 * multiple components (FeesPreview hook, Receipt, etc.) issues a single network request.
 *
 * Skipped entirely on chains without a RELAY_FEE relayer — the CGW rejects every preview
 * there, so no `enabled` flag from a caller can override the capability gate.
 */
export const useGtfFeePreview = ({ enabled, safeTx, chainId, safeAddress, gasToken, numberSignatures }: Args) => {
  const currency = useAppSelector(selectCurrency)
  const chain = useCurrentChain()

  return useGetGtfFeePreviewQuery(
    enabled && isGtfFeePreviewAvailable(chain) && safeTx && chainId && safeAddress && gasToken && numberSignatures > 0
      ? {
          chainId,
          safeAddress,
          tx: {
            to: safeTx.data.to,
            value: safeTx.data.value,
            data: safeTx.data.data,
            operation: safeTx.data.operation,
            gasToken,
            numberSignatures,
            nonce: safeTx.data.nonce,
            fiatCode: toSupportedFiatCode(currency),
          },
        }
      : skipToken,
  )
}
