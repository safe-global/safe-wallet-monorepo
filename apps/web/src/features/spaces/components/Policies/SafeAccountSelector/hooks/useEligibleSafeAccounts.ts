import { useCallback, useMemo } from 'react'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { flattenSafeItems } from '@/hooks/safes/useAllSafesGrouped'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { selectUndeployedSafes } from '@/features/counterfactual/public/store/undeployedSafesSlice'
import { useSpaceSafes } from '../../../../public/hooks/useSpaceSafes'
import { safeKey, useSafeRoleQueries } from '../../../../hooks/useSafeRoleQueries'
import { buildSafeAccountId, groupSafeAccounts } from '../utils'
import type { ChainInfo } from '../../../../public/types'
import type {
  SafeAccountEligibility,
  SafeAccountEntry,
  SafeAccountOption,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'

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
  const { configs: chains } = useChains()

  const safeItems = useMemo(() => flattenSafeItems(allSafes), [allSafes])

  const {
    overviews,
    proposerSafes,
    isOverviewsResolved,
    isProposerResolved,
    isOverviewsError,
    refetch: refetchRoles,
  } = useSafeRoleQueries(safeItems, { skipProposers: signersOnly })

  // A delegates failure only under-reports proposer access, so it degrades instead of failing the field.
  const isError = isSafesError || isOverviewsError

  // `isReadOnly` is fail-closed until the overviews land, so stay loading rather than flash an empty list.
  const isLoading = !!wallet && (isSafesLoading || (!isError && (!isOverviewsResolved || !isProposerResolved)))

  const overviewsByKey = useMemo(() => {
    const map = new Map<string, SafeOverview>()
    for (const overview of overviews ?? []) {
      map.set(safeKey(overview.chainId, overview.address.value), overview)
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

      const overview = overviewsByKey.get(safeKey(item.chainId, item.address))

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

  const refetch = useCallback(() => {
    if (!isSpaceSafesUninitialized) refetchSpaceSafes()
    refetchRoles()
  }, [isSpaceSafesUninitialized, refetchSpaceSafes, refetchRoles])

  return { accounts, isLoading, isError, hasWallet: !!wallet, signersOnly, refetch }
}
