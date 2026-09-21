import { skipToken } from '@reduxjs/toolkit/query'
import type { OperationType } from '@safe-global/types-kit'
import useAsync from '@safe-global/utils/hooks/useAsync'

import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getNonces } from '@/services/tx/tx-sender/recommendedNonce'
import { useGetGtfFeePreviewQuery } from '@/store/api/gateway'
import { toSupportedFiatCode } from '@/store/api/gateway/gtfFeePreview'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { isGtfFeePreviewAvailable } from '../utils/isGtfFeePreviewAvailable'

/**
 * The encoded transaction payload the fees endpoint needs to probe a gas token.
 */
export type FeePreviewTx = {
  to: string
  value: string
  data: string
  operation: OperationType
}

/**
 * `blocked` means fees cannot be paid in the sent token — the probe errored, or the chain has
 * no RELAY_FEE relayer so previews are impossible.
 */
export type ResolvedGasTokenState =
  | { status: 'resolving' }
  | { status: 'resolved'; address: string }
  | { status: 'blocked' }

/**
 * Probe `/fees/preview` for the sent token only — probing every held token flooded the CGW and
 * tripped rate limits (PLA-1774). No relayer on the chain → `blocked` without firing a request;
 * `tx` undefined (form incomplete) → `resolving` without firing one.
 */
export const useResolvedGasToken = (
  sentTokenAddress: string | undefined,
  tx: FeePreviewTx | undefined,
): ResolvedGasTokenState => {
  const { safe, safeAddress } = useSafeInfo()
  const chain = useCurrentChain()
  const currency = useAppSelector(selectCurrency)

  // The tx doesn't exist yet on the Create step. The CGW rejects nonces <= the Safe's current
  // nonce, so probe against the recommended next nonce (the value the tx will actually get when
  // proposed). The exact nonce doesn't change which token can cover fees.
  const [recommendedNonce] = useAsync(async () => {
    if (!safe.chainId || !safeAddress) return
    if (!safe.deployed) return 0
    try {
      const nonces = await getNonces(safe.chainId, safeAddress)
      return nonces?.recommendedNonce ?? safe.nonce
    } catch {
      return safe.nonce
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeAddress, safe.chainId, safe.deployed, safe.nonce, safe.txQueuedTag, safe.txHistoryTag])

  const probeArg =
    isGtfFeePreviewAvailable(chain) &&
    sentTokenAddress &&
    tx &&
    safeAddress &&
    safe.threshold > 0 &&
    recommendedNonce !== undefined
      ? {
          chainId: chain.chainId,
          safeAddress,
          tx: {
            ...tx,
            gasToken: sentTokenAddress,
            numberSignatures: safe.threshold,
            nonce: recommendedNonce,
            fiatCode: toSupportedFiatCode(currency),
          },
        }
      : skipToken

  const probe = useGetGtfFeePreviewQuery(probeArg)

  if (!isGtfFeePreviewAvailable(chain)) {
    return { status: 'blocked' }
  }
  if (probeArg === skipToken) {
    return { status: 'resolving' }
  }
  if (probe.data) {
    return { status: 'resolved', address: probeArg.tx.gasToken }
  }
  if (probe.error) {
    return { status: 'blocked' }
  }
  return { status: 'resolving' }
}
