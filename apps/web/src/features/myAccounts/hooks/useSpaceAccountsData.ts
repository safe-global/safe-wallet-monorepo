import { useMemo } from 'react'
import useChains from '@/hooks/useChains'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { type AddressBookState, selectAllAddressBooks } from '@/store/addressBookSlice'
import useWallet from '@/hooks/wallets/useWallet'
import {
  isMultiChainSafeItem,
  flattenSafeItems,
  type AllSafeItems,
  type MultiChainSafeItem,
  type SafeItem,
} from '@/hooks/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { skipToken } from '@reduxjs/toolkit/query'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AppRoutes } from '@/config/routes'
import type { Account, SubAccount } from '../components/AccountsWidget/types'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { selectUndeployedSafes } from '@/features/counterfactual/store'
import type { UndeployedSafesState } from '@safe-global/utils/features/counterfactual/store/types'
import { PendingSafeStatus } from '@safe-global/utils/features/counterfactual/store/types'

const getLocalName = (address: string, safes: SafeItem[], localAddressBooks: AddressBookState): string => {
  for (const safe of safes) {
    const name = localAddressBooks[safe.chainId]?.[address]
    if (name) return name
  }
  return ''
}

const getSafeHref = (chain: Chain | undefined, address: string): string => {
  const shortName = chain?.shortName ?? ''
  return `${AppRoutes.home}?safe=${shortName}:${address}`
}

const getCfOwners = (address: string, chainId: string, undeployedSafes: UndeployedSafesState): string | undefined => {
  const cfSafe = undeployedSafes[chainId]?.[address]
  if (!cfSafe) return undefined
  const { threshold, owners } = cfSafe.props.safeAccountConfig
  return `${threshold}/${owners.length}`
}

// An account is "not activated" only when none of its chains are deployed yet.
const getActivationStatus = (
  safes: SafeItem[],
  undeployedSafes: UndeployedSafesState,
): { isUndeployed: boolean; isActivating: boolean } => {
  const isUndeployed = safes.length > 0 && safes.every((s) => Boolean(undeployedSafes[s.chainId]?.[s.address]))
  const isActivating =
    isUndeployed &&
    safes.some((s) => {
      const undeployed = undeployedSafes[s.chainId]?.[s.address]
      return Boolean(undeployed && undeployed.status.status !== PendingSafeStatus.AWAITING_EXECUTION)
    })
  return { isUndeployed, isActivating }
}

const formatMultichainAccount = (
  safe: MultiChainSafeItem,
  chainMap: Map<string, Chain>,
  overviews: SafeOverview[] | undefined,
  localAddressBooks: AddressBookState,
  undeployedSafes: UndeployedSafesState,
): Account => {
  const safeOverviews =
    overviews?.filter(
      (o) => sameAddress(o.address.value, safe.address) && safe.safes.some((s) => s.chainId === o.chainId),
    ) ?? []

  const totalFiat = safeOverviews.reduce((sum, overview) => sum + parseFloat(overview.fiatTotal || '0'), 0)
  const firstOverview = safeOverviews[0]
  const firstChain = chainMap.get(safe.safes[0]?.chainId)
  const name = safe.name || getLocalName(safe.address, safe.safes, localAddressBooks) || ''

  const subAccounts: SubAccount[] = safe.safes.map((s) => {
    const chain = chainMap.get(s.chainId)
    const overview = safeOverviews.find((o) => o.chainId === s.chainId)
    return {
      chainId: s.chainId,
      fiatTotal: overview?.fiatTotal,
      href: getSafeHref(chain, safe.address),
    }
  })

  // CF entries are per-chain; pick the first chain in the group that has one
  // rather than assuming index 0 — chain ordering in `safe.safes` isn't tied
  // to which chain the user created the CF safe on.
  const cfChainId = safe.safes.find((s) => undeployedSafes[s.chainId]?.[safe.address])?.chainId
  const owners = firstOverview
    ? `${firstOverview.threshold}/${firstOverview.owners.length}`
    : ((cfChainId && getCfOwners(safe.address, cfChainId, undeployedSafes)) ?? '')

  return {
    name,
    address: safe.address,
    href: getSafeHref(firstChain, safe.address),
    safes: safe.safes,
    fiatTotal: safeOverviews.length > 0 ? totalFiat.toString() : undefined,
    owners,
    subAccounts,
    ...getActivationStatus(safe.safes, undeployedSafes),
  }
}

const formatSingleSafe = (
  safe: SafeItem,
  chainMap: Map<string, Chain>,
  overviews: SafeOverview[] | undefined,
  localAddressBooks: AddressBookState,
  undeployedSafes: UndeployedSafesState,
): Account => {
  const chain = chainMap.get(safe.chainId)
  const overview = overviews?.find((o) => sameAddress(o.address.value, safe.address) && o.chainId === safe.chainId)

  const name = safe.name || localAddressBooks[safe.chainId]?.[safe.address] || ''

  const owners = overview
    ? `${overview.threshold}/${overview.owners.length}`
    : (getCfOwners(safe.address, safe.chainId, undeployedSafes) ?? '')

  return {
    name,
    address: safe.address,
    href: getSafeHref(chain, safe.address),
    safes: [safe],
    fiatTotal: overview?.fiatTotal,
    owners,
    ...getActivationStatus([safe], undeployedSafes),
  }
}

const useSpaceAccountsData = (safes: AllSafeItems) => {
  const { configs: chains } = useChains()
  const currency = useAppSelector(selectCurrency)
  const wallet = useWallet()
  const localAddressBooks = useAppSelector(selectAllAddressBooks)
  const undeployedSafes = useAppSelector(selectUndeployedSafes)

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
        return formatMultichainAccount(safe, chainMap, overviews, localAddressBooks, undeployedSafes)
      }

      return formatSingleSafe(safe, chainMap, overviews, localAddressBooks, undeployedSafes)
    })
  }, [safes, overviews, chains, localAddressBooks, undeployedSafes])

  return { accounts, isLoading: isFetching, error: error ? getRtkQueryErrorMessage(error) : undefined, refetch }
}

export default useSpaceAccountsData
