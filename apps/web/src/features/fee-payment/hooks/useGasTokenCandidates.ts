import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'

import { useTrustedTokenBalances } from '@/hooks/loadables/useTrustedTokenBalances'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useGetGasTokensQuery } from '@/store/api/gateway'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { FeePreviewTx } from './useResolvedGasToken'

export type GasTokenCandidate = {
  address: string
  symbol: string
  logoUri: string
  decimals: number
  fiatBalance: string
}

export type GasTokenCandidatesResult = {
  candidates: GasTokenCandidate[]
  defaultAddress?: string
}

const toFiat = (fiatBalance: string): number => {
  const value = Number(fiatBalance)
  return Number.isFinite(value) ? value : 0
}

/**
 * Tokens the Safe holds that the fee service accepts as Pay from Safe gas tokens on this chain.
 *
 * The accepted ERC-20s come from the CGW (`/fees/gas-tokens`), which serves the Config Service
 * list the fee service itself checks against — so the selector can't offer a token the quote
 * would reject. No `/fees/preview` probes are needed.
 *
 * The native gas token is always included when held: the fee service accepts it everywhere and
 * it is not part of the list, so the flow still works on chains with no ERC-20 gas tokens.
 *
 * Order: native first, then the held tokens by fiat value, so the ones that can actually cover
 * the fee come first.
 */
export const useGasTokenCandidates = (tx: FeePreviewTx | undefined): GasTokenCandidatesResult => {
  const [balances] = useTrustedTokenBalances()
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()

  const { data: gasTokens } = useGetGasTokensQuery(chain?.chainId ? { chainId: chain.chainId } : skipToken)

  const candidates = useMemo<GasTokenCandidate[]>(() => {
    if (!tx || !balances?.items || !chain?.chainId || safe.threshold <= 0) return []

    const isNative = (address: string, type: string) => type === 'NATIVE_TOKEN' || sameAddress(address, ZERO_ADDRESS)

    return balances.items
      .filter((b) => BigInt(b.balance) > 0n)
      .filter((b) => {
        // Native always passes — the fee service accepts it on every chain, and it is returned
        // with a non-ZERO address on some chains (e.g. POL), where it would otherwise be filtered out.
        if (isNative(b.tokenInfo.address, b.tokenInfo.type)) return true
        return (gasTokens ?? []).some((gasToken) => sameAddress(gasToken.address, b.tokenInfo.address))
      })
      .map((b) => ({
        address: b.tokenInfo.address,
        symbol: b.tokenInfo.symbol,
        logoUri:
          // Prefer the chain config's native logo — TX Service per-chain currency_logo URL can
          // fail to load through the IframeIcon sandbox.
          isNative(b.tokenInfo.address, b.tokenInfo.type)
            ? (chain.nativeCurrency.logoUri ?? b.tokenInfo.logoUri)
            : b.tokenInfo.logoUri,
        decimals: b.tokenInfo.decimals,
        fiatBalance: b.fiatBalance,
        isNative: isNative(b.tokenInfo.address, b.tokenInfo.type),
      }))
      .sort((a, z) => {
        if (a.isNative !== z.isNative) return a.isNative ? -1 : 1
        return toFiat(z.fiatBalance) - toFiat(a.fiatBalance)
      })
      .map(({ isNative: _isNative, ...candidate }) => candidate)
  }, [tx, balances, chain?.chainId, chain?.nativeCurrency.logoUri, safe.threshold, gasTokens])

  return { candidates, defaultAddress: candidates[0]?.address }
}
