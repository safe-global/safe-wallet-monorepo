import { useCallback, useMemo } from 'react'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { flattenSafeItems } from '@/hooks/safes/useAllSafesGrouped'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { selectUndeployedSafes } from '@/features/counterfactual/public/store/undeployedSafesSlice'
import { useSpaceSafes } from '../../../../public/hooks/useSpaceSafes'
import { useSafeRoleQueries } from '../../../../hooks/useSafeRoleQueries'
import { buildSafeAccountId, groupSafeAccounts } from '../utils'
import type { ChainInfo } from '../../../../public/types'
import type {
  SafeAccountEligibility,
  SafeAccountEntry,
  SafeAccountOption,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'

const overviewKey = (chainId: string, address: string) => `${chainId}:${address.toLowerCase()}`

const getEligibility = (isSigner: boolean, isProposer: boolean): SafeAccountEligibility => {
  if (isSigner && isProposer) return 'signer-and-proposer'
  return isSigner ? 'signer' : 'proposer'
}

export type EligibleSafeAccountsOptions = {
  signersOnly?: boolean
}

/**
 * Safes in the current Space the connected wallet is a signer or a proposer on (signers only with
 * `signersOnly`), grouped by address. Safes the wallet has no such role on are absent; counterfactual
 * ones are listed but disabled. Returns the flag so the selector's copy matches.
 */
export const useEligibleSafeAccounts = ({ signersOnly = false }: EligibleSafeAccountsOptions = {}) => {
  const {
    allSafes,
    isLoading: isSafesLoading,
    isError: isSafesError,
    refetch: refetchSpaceSafes,
    isUninitialized: isSpaceSafesUninitialized,
  } = useSpaceSafes()
  const { address: wallet = '' } = useWallet() || {}
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const { configs: chains, loading: isChainsLoading } = useChains()

  const safeItems = useMemo(() => flattenSafeItems(allSafes), [allSafes])

  const { overviewsQuery, proposerSafesQuery } = useSafeRoleQueries(safeItems, { skipProposers: signersOnly })

  // A delegates failure only under-reports proposer access, so it degrades instead of failing the field.
  const isError = isSafesError || overviewsQuery.isError

  // `currentData`: `data` still holds the previous args' result while a new key is in flight.
  const overviews = overviewsQuery.currentData
  const proposerSafes = proposerSafesQuery.currentData

  const isOverviewsResolved = safeItems.length === 0 || overviews !== undefined || overviewsQuery.isError
  // A skipped query only means "no proposer Safes" once the chain configs it is built from have loaded.
  const isProposerStatusResolved =
    proposerSafes !== undefined ||
    proposerSafesQuery.isError ||
    (proposerSafesQuery.isUninitialized && (signersOnly || !isChainsLoading))

  // `isReadOnly` is fail-closed until the overviews land, so stay loading rather than flash an empty list.
  const isLoading = !!wallet && (isSafesLoading || (!isError && (!isOverviewsResolved || !isProposerStatusResolved)))

  const overviewsByKey = useMemo(() => {
    const map = new Map<string, SafeOverview>()
    for (const overview of overviews ?? []) {
      map.set(overviewKey(overview.chainId, overview.address.value), overview)
    }
    return map
  }, [overviews])

  // Resolved here, not per row: a group header renders every chain and cannot call a hook in that loop.
  const chainsById = useMemo(() => {
    const map = new Map<string, ChainInfo>()
    for (const chain of chains) {
      const { chainId, chainName, chainLogoUri, shortName } = chain
      map.set(chainId, { chainId, chainName, chainLogoUri, shortName })
    }
    return map
  }, [chains])

  const accounts = useMemo<SafeAccountEntry[]>(() => {
    if (!wallet || isLoading) return []

    const options = safeItems.flatMap<SafeAccountOption>((item) => {
      const isSigner = !item.isReadOnly
      const isProposer =
        !signersOnly && (proposerSafes?.[item.chainId] ?? []).some((safe) => sameAddress(safe, item.address))

      if (!isSigner && !isProposer) return []

      const overview = overviewsByKey.get(overviewKey(item.chainId, item.address))

      return [
        {
          id: buildSafeAccountId(item.chainId, item.address),
          chainId: item.chainId,
          address: item.address,
          name: item.name,
          threshold: overview?.threshold,
          owners: overview?.owners.length,
          eligibility: getEligibility(isSigner, isProposer),
          chain: chainsById.get(item.chainId),
          fiatTotal: overview?.fiatTotal,
          ineligibleReason: undeployedSafes[item.chainId]?.[item.address] ? 'not-activated' : undefined,
        },
      ]
    })

    return groupSafeAccounts(options)
  }, [wallet, isLoading, safeItems, signersOnly, proposerSafes, overviewsByKey, chainsById, undeployedSafes])

  // Destructured for stable deps: the whole query objects would hand consumers a new `onRetry` per render.
  const { refetch: refetchOverviews, isUninitialized: isOverviewsUninitialized } = overviewsQuery
  const { refetch: refetchProposerSafes, isUninitialized: isProposerSafesUninitialized } = proposerSafesQuery

  // All three skip in normal states, and `refetch()` throws on a query that never started.
  const refetch = useCallback(() => {
    if (!isSpaceSafesUninitialized) refetchSpaceSafes()
    if (!isOverviewsUninitialized) refetchOverviews()
    if (!isProposerSafesUninitialized) refetchProposerSafes()
  }, [
    isSpaceSafesUninitialized,
    refetchSpaceSafes,
    refetchOverviews,
    isOverviewsUninitialized,
    refetchProposerSafes,
    isProposerSafesUninitialized,
  ])

  return { accounts, isLoading, isError, hasWallet: !!wallet, signersOnly, refetch }
}
