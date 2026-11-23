import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { useGetMultipleSafeOverviewsQuery, useGetProposerSafesQuery } from '@/store/api/gateway'
import { selectCurrency } from '@/store/settingsSlice'

type SafeRef = Pick<SafeItem, 'chainId' | 'address'>

// Overview args match `useSpaceSafeOverviews` so they share its cache entry; one delegates request per chain
export const useSafeRoleQueries = (
  safes: SafeRef[],
  { skip = false, skipProposers = false }: { skip?: boolean; skipProposers?: boolean } = {},
) => {
  const { address: wallet = '' } = useWallet() || {}
  const currency = useAppSelector(selectCurrency)
  const { configs: chains } = useChains()

  const overviewSafes = useMemo(() => safes.map(({ chainId, address }) => ({ chainId, address })), [safes])
  const overviewsQuery = useGetMultipleSafeOverviewsQuery(
    !skip && overviewSafes.length > 0 ? { safes: overviewSafes, currency } : skipToken,
  )

  const proposerChains = useMemo(() => {
    const chainIds = new Set(safes.map((safe) => safe.chainId))
    return chains.filter((chain) => chainIds.has(chain.chainId))
  }, [chains, safes])
  const proposerSafesQuery = useGetProposerSafesQuery(
    !skip && !skipProposers && wallet && proposerChains.length > 0
      ? { chains: proposerChains, delegate: wallet }
      : skipToken,
  )

  return { overviewsQuery, proposerSafesQuery }
}
