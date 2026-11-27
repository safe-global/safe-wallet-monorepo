import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'

import { useTrustedTokenBalances } from '@/hooks/loadables/useTrustedTokenBalances'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useGetGasTokensQuery } from '@/store/api/gateway'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { FeePreviewTx } from '../public/hooks/useResolvedGasToken'

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
  hasGasTokenList: boolean
}

const toFiat = (fiatBalance: string): number => {
  const value = Number(fiatBalance)
  return Number.isFinite(value) ? value : 0
}

// The native token is not in the gas tokens list: the fee service accepts it on every chain.
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
        // Some chains return the native token with a non-zero address (POL on Polygon).
        if (isNative(b.tokenInfo.address, b.tokenInfo.type)) return true
        return (gasTokens ?? []).some((gasToken) => sameAddress(gasToken.address, b.tokenInfo.address))
      })
      .map((b) => ({
        address: b.tokenInfo.address,
        symbol: b.tokenInfo.symbol,
        logoUri:
          // The TX Service native logo can fail to load in the IframeIcon sandbox.
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

  return { candidates, defaultAddress: candidates[0]?.address, hasGasTokenList: gasTokens !== undefined }
}
