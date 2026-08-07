import { useMemo } from 'react'

import { useTrustedTokenBalances } from '@/hooks/loadables/useTrustedTokenBalances'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getGasTokenAllowlistOrder, isAllowlistedGasToken } from '../constants/gasTokenAllowlist'
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

/**
 * Tokens the Safe holds that are accepted as GTF gas tokens on the current chain.
 *
 * Source of truth: the hardcoded allowlist in `constants/gasTokenAllowlist.ts` (PLA-1412).
 * This is an interim implementation; PLA-1389 will replace the allowlist with an HTTP-fetched
 * config. Until then, no `/fees/preview` probes are needed — allowlist membership is decided
 * synchronously off the chain config + balances.
 *
 * The native gas token is always included when held, regardless of allowlist membership, so the
 * flow still works on chains not yet in the allowlist (native-only).
 */
export const useGasTokenCandidates = (tx: FeePreviewTx | undefined): GasTokenCandidatesResult => {
  const [balances] = useTrustedTokenBalances()
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()

  const candidates = useMemo<GasTokenCandidate[]>(() => {
    if (!tx || !balances?.items || !chain?.chainId || safe.threshold <= 0) return []

    return balances.items
      .filter((b) => BigInt(b.balance) > 0n)
      .filter((b) => {
        // Native always passes — required for chains absent from the allowlist,
        // where POL is returned with a non-ZERO address and would otherwise be filtered out.
        if (b.tokenInfo.type === 'NATIVE_TOKEN' || sameAddress(b.tokenInfo.address, ZERO_ADDRESS)) return true
        return isAllowlistedGasToken(chain.chainId, b.tokenInfo.address)
      })
      .map((b) => ({
        address: b.tokenInfo.address,
        symbol: b.tokenInfo.symbol,
        logoUri:
          // Prefer the chain config's native logo — TX Service per-chain currency_logo URL can
          // fail to load through the IframeIcon sandbox.
          b.tokenInfo.type === 'NATIVE_TOKEN' || sameAddress(b.tokenInfo.address, ZERO_ADDRESS)
            ? (chain.nativeCurrency.logoUri ?? b.tokenInfo.logoUri)
            : b.tokenInfo.logoUri,
        decimals: b.tokenInfo.decimals,
        fiatBalance: b.fiatBalance,
      }))
      .sort((a, z) => {
        // Native and listed ERC-20s ordered by allowlist position; everything else (held native
        // on chains absent from the allowlist) goes last.
        const aOrder = getGasTokenAllowlistOrder(chain.chainId, a.address)
        const zOrder = getGasTokenAllowlistOrder(chain.chainId, z.address)
        if (aOrder === -1 && zOrder === -1) return 0
        if (aOrder === -1) return 1
        if (zOrder === -1) return -1
        return aOrder - zOrder
      })
  }, [tx, balances, chain?.chainId, chain?.nativeCurrency.logoUri, safe.threshold])

  return { candidates, defaultAddress: candidates[0]?.address }
}
