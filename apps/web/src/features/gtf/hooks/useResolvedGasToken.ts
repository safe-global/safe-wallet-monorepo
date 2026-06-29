import { useEffect, useMemo, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { OperationType } from '@safe-global/types-kit'
import useAsync from '@safe-global/utils/hooks/useAsync'

import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useBalances from '@/hooks/useBalances'
import { getNonces } from '@/services/tx/tx-sender/recommendedNonce'
import { useGetGtfFeePreviewQuery } from '@/store/api/gateway'
import { toSupportedFiatCode } from '@/store/api/gateway/gtfFeePreview'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'

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
 * Resolution of the gas token for a Safe-paid transaction.
 *
 * - `resolving`: the cascade is still probing or not enough context to start
 * - `resolved`: a token (at `address`) successfully passed a `/fees/preview` probe
 * - `blocked`: every candidate probe errored, including the sent token — the Safe cannot cover
 *   fees with anything it holds
 */
export type ResolvedGasTokenState =
  | { status: 'resolving' }
  | { status: 'resolved'; address: string }
  | { status: 'blocked' }

/**
 * Walk the Safe's balances probing `/fees/preview` per token. The sent token is guaranteed last
 * as the fallback, so any other held token is preferred if the backend says it can cover fees.
 * Stops at the first probe that returns 200. If every probe errors, resolution is `blocked`.
 *
 * The `tx` payload is what each probe submits alongside the candidate `gasToken`. Callers on the
 * Create step typically build it from form state via `createTokenTransferParams`; on Review it
 * comes from `SafeTxContext.safeTx.data`. When `tx` is `undefined` (form incomplete), the hook
 * returns `resolving` without firing a probe.
 */
export const useResolvedGasToken = (
  sentTokenAddress: string | undefined,
  tx: FeePreviewTx | undefined,
): ResolvedGasTokenState => {
  const { balances } = useBalances()
  const { safe, safeAddress } = useSafeInfo()
  const chain = useCurrentChain()
  const currency = useAppSelector(selectCurrency)

  // The tx doesn't exist yet on the Create step. The CGW rejects nonces <= the Safe's current
  // nonce, so probe against the recommended next nonce (the value the tx will actually get when
  // proposed). The exact nonce doesn't change which token can cover fees.
  const [recommendedNonce] = useAsync(async () => {
    if (!safe.chainId || !safeAddress) return
    if (!safe.deployed) return 0
    const nonces = await getNonces(safe.chainId, safeAddress)
    return nonces?.recommendedNonce
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeAddress, safe.chainId, safe.txQueuedTag, safe.txHistoryTag])

  const candidates = useMemo(() => {
    if (!balances?.items || !sentTokenAddress) return []

    const alternatives = balances.items
      .filter((b) => BigInt(b.balance) > 0n)
      .filter((b) => !sameAddress(b.tokenInfo.address, sentTokenAddress))
      .map((b) => b.tokenInfo.address)

    // Sent token is always the fallback, tried after every alternative.
    return [...alternatives, sentTokenAddress]
  }, [balances, sentTokenAddress])

  const candidatesKey = candidates.join(',')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [candidatesKey])

  const currentCandidate = candidates[index]

  const canProbe = Boolean(
    currentCandidate && tx && chain?.chainId && safeAddress && safe.threshold > 0 && recommendedNonce !== undefined,
  )

  const probe = useGetGtfFeePreviewQuery(
    canProbe && tx && chain
      ? {
          chainId: chain.chainId,
          safeAddress,
          tx: {
            ...tx,
            gasToken: currentCandidate,
            numberSignatures: safe.threshold,
            nonce: String(recommendedNonce),
            fiatCode: toSupportedFiatCode(currency),
          },
        }
      : skipToken,
  )

  useEffect(() => {
    if (!canProbe) return
    if (probe.isLoading || probe.isFetching) return
    if (probe.error && index < candidates.length - 1) {
      setIndex((i) => i + 1)
    }
  }, [probe.isLoading, probe.isFetching, probe.error, canProbe, index, candidates.length])

  if (candidates.length === 0 || !canProbe) {
    return { status: 'resolving' }
  }
  if (probe.data) {
    return { status: 'resolved', address: currentCandidate }
  }
  if (probe.error && index >= candidates.length - 1) {
    return { status: 'blocked' }
  }
  return { status: 'resolving' }
}
