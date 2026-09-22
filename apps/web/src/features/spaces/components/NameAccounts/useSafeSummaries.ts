import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { flattenSafeItems, isMultiChainSafeItem, type AllSafeItems } from '@/hooks/safes'
import { getSafeSetups, getSharedSetup } from '@/features/multichain'
import { selectUndeployedSafes } from '@/features/counterfactual/store'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'

export type SafeSummary = {
  threshold?: number
  owners?: number
  /** Multichain Safe whose per-chain setups differ — show the threshold icon only. */
  thresholdMixed: boolean
  balance?: string
  loaded: boolean
}

/** Threshold and fiat balance per address for the few Safes in the naming step, fetched in one request. */
export const useSafeSummaries = (items: AllSafeItems): Map<string, SafeSummary> => {
  const currency = useAppSelector(selectCurrency)
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const { address: walletAddress } = useWallet() ?? {}

  const deployedSafes = useMemo(
    () => flattenSafeItems(items).filter((safe) => !undeployedSafes[safe.chainId]?.[safe.address]),
    [items, undeployedSafes],
  )
  const { data: overviews, isError } = useGetMultipleSafeOverviewsQuery(
    deployedSafes.length > 0 ? { currency, walletAddress, safes: deployedSafes } : skipToken,
  )

  return useMemo(() => {
    const loaded = overviews !== undefined || isError || deployedSafes.length === 0
    const summaries = new Map<string, SafeSummary>()

    for (const item of items) {
      const safes = isMultiChainSafeItem(item) ? item.safes : [item]
      const setup = getSharedSetup(getSafeSetups(safes, overviews ?? [], undeployedSafes))
      const fiatTotals = safes.flatMap((safe) => {
        const overview = overviews?.find(
          (o) => o.chainId === safe.chainId && sameAddress(o.address.value, safe.address),
        )
        return overview ? [Number(overview.fiatTotal)] : []
      })

      summaries.set(item.address.toLowerCase(), {
        threshold: setup?.threshold,
        owners: setup?.owners.length,
        thresholdMixed: loaded && !setup && isMultiChainSafeItem(item),
        balance: fiatTotals.length > 0 ? String(fiatTotals.reduce((sum, value) => sum + value, 0)) : undefined,
        loaded,
      })
    }

    return summaries
  }, [items, overviews, isError, undeployedSafes, deployedSafes.length])
}
