import { useMemo } from 'react'
import useChains from '@/hooks/useChains'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import {
  isMultiChainSafeItem,
  flattenSafeItems,
  type AllSafeItems,
  type MultiChainSafeItem,
  type SafeItem,
} from '@/hooks/safes'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { skipToken } from '@reduxjs/toolkit/query'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AppRoutes } from '@/config/routes'
import type { Account, SubAccount } from '../components/AccountsWidget/types'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

const getSafeHref = (chain: Chain | undefined, address: string): string => {
  const shortName = chain?.shortName ?? ''
  return `${AppRoutes.home}?safe=${shortName}:${address}`
}

const formatMultichainAccount = (
  safe: MultiChainSafeItem,
  chainMap: Map<string, Chain>,
  overviews: SafeOverview[] | undefined,
): Account => {
  const safeOverviews =
    overviews?.filter(
      (o) => sameAddress(o.address.value, safe.address) && safe.safes.some((s) => s.chainId === o.chainId),
    ) ?? []

  const totalFiat = safeOverviews.reduce((sum, overview) => sum + parseFloat(overview.fiatTotal || '0'), 0)
  const firstOverview = safeOverviews[0]
  const firstChain = chainMap.get(safe.safes[0]?.chainId)
  const name = safe.name || shortenAddress(safe.address)

  const subAccounts: SubAccount[] = safe.safes.map((s) => {
    const chain = chainMap.get(s.chainId)
    const overview = safeOverviews.find((o) => o.chainId === s.chainId)
    return {
      chainId: s.chainId,
      fiatTotal: overview?.fiatTotal,
      href: getSafeHref(chain, safe.address),
    }
  })

  return {
    id: safe.address,
    name,
    address: safe.address,
    href: getSafeHref(firstChain, safe.address),
    safes: safe.safes,
    fiatTotal: safeOverviews.length > 0 ? totalFiat.toString() : undefined,
    owners: firstOverview ? `${firstOverview.threshold}/${firstOverview.owners.length}` : '',
    subAccounts,
  }
}

const formatSingleSafe = (
  safe: SafeItem,
  chainMap: Map<string, Chain>,
  overviews: SafeOverview[] | undefined,
): Account => {
  const chain = chainMap.get(safe.chainId)
  const overview = overviews?.find((o) => sameAddress(o.address.value, safe.address) && o.chainId === safe.chainId)

  const name = safe.name || shortenAddress(safe.address)

  return {
    id: `${safe.chainId}:${safe.address}`,
    name,
    address: safe.address,
    href: getSafeHref(chain, safe.address),
    safes: [safe],
    fiatTotal: overview?.fiatTotal,
    owners: overview ? `${overview.threshold}/${overview.owners.length}` : '',
  }
}

const useSpaceAccountsData = (safes: AllSafeItems) => {
  const { configs: chains } = useChains()
  const currency = useAppSelector(selectCurrency)
  const wallet = useWallet()

  const flatSafes = useMemo(() => flattenSafeItems(safes), [safes])

  const {
    data: overviews,
    isFetching,
    error,
    refetch,
  } = useGetMultipleSafeOverviewsQuery(
    flatSafes.length > 0 ? { safes: flatSafes, currency, walletAddress: wallet?.address } : skipToken,
  )

  const accounts = useMemo((): Account[] => {
    const chainMap = new Map(chains.map((c) => [c.chainId, c]))

    return safes.map((safe): Account => {
      if (isMultiChainSafeItem(safe)) {
        return formatMultichainAccount(safe, chainMap, overviews)
      }

      return formatSingleSafe(safe, chainMap, overviews)
    })
  }, [safes, overviews, chains])

  return { accounts, isLoading: isFetching, error: error ? getRtkQueryErrorMessage(error) : undefined, refetch }
}

export default useSpaceAccountsData
