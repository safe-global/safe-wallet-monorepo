import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { selectUndeployedSafes } from '@/features/counterfactual/store/undeployedSafesSlice'
import { getSafeSetups, getSharedSetup, hasMultiChainAddNetworkFeature } from '@/features/multichain'
import { isPredictedSafeProps } from '@/features/counterfactual/services'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import useSafeAddress from '@/hooks/useSafeAddress'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { type MultiChainSafeItem, getComparator } from '@/hooks/safes'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import useWallet from '@/hooks/wallets/useWallet'
import { selectCurrency } from '@/store/settingsSlice'
import useChains from '@/hooks/useChains'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'

export function useMultiAccountItemData(multiSafeAccountItem: MultiChainSafeItem) {
  const { address, safes, isPinned, name } = multiSafeAccountItem

  const router = useRouter()
  const isWelcomePage = router.pathname === AppRoutes.welcome.accounts
  const isSpaceRoute = useIsSpaceRoute()
  const safeAddress = useSafeAddress()
  const isCurrentSafe = sameAddress(safeAddress, address)

  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = useMemo(() => getComparator(orderBy), [orderBy])
  const sortedSafes = useMemo(() => [...safes].sort(sortComparator), [safes, sortComparator])

  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const deployedSafes = useMemo(
    () => sortedSafes.filter((safe) => !undeployedSafes[safe.chainId]?.[safe.address]),
    [sortedSafes, undeployedSafes],
  )

  const currency = useAppSelector(selectCurrency)
  const { address: walletAddress } = useWallet() || {}

  const { data: safeOverviews } = useGetMultipleSafeOverviewsQuery({ currency, walletAddress, safes: deployedSafes })

  const safeSetups = useMemo(
    () => getSafeSetups(sortedSafes, safeOverviews ?? [], undeployedSafes),
    [safeOverviews, sortedSafes, undeployedSafes],
  )
  const sharedSetup = useMemo(() => getSharedSetup(safeSetups), [safeSetups])

  const totalFiatValue = useMemo(
    () => safeOverviews?.reduce((sum, overview) => sum + Number(overview.fiatTotal), 0),
    [safeOverviews],
  )

  const { configs: chains } = useChains()
  const hasReplayableSafe = useMemo(() => {
    return sortedSafes.some((safeItem) => {
      const undeployedSafe = undeployedSafes[safeItem.chainId]?.[safeItem.address]
      const chain = chains.find((chain) => chain.chainId === safeItem.chainId)
      const addNetworkFeatureEnabled = hasMultiChainAddNetworkFeature(chain)
      return (!undeployedSafe || !isPredictedSafeProps(undeployedSafe.props)) && addNetworkFeatureEnabled
    })
  }, [chains, sortedSafes, undeployedSafes])

  const isReadOnly = useMemo(() => sortedSafes.every((safe) => safe.isReadOnly), [sortedSafes])

  const deployedChainIds = useMemo(() => sortedSafes.map((safe) => safe.chainId), [sortedSafes])

  return {
    address,
    name,
    sortedSafes,
    safeOverviews,
    sharedSetup,
    totalFiatValue,
    hasReplayableSafe,
    isPinned,
    isCurrentSafe,
    isReadOnly,
    isWelcomePage,
    deployedChainIds,
    isSpaceRoute,
  }
}
