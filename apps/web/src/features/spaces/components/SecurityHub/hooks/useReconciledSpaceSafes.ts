import { useMemo } from 'react'
import { useSpaceSafes } from '@/features/spaces'
import { useAppSelector } from '@/store'
import { selectUndeployedSafes, selectCurrency } from '@/store/slices'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import type { useLoadFeature } from '@/features/__core__'
import type { SecurityContract } from '@/features/security'
import { flattenSafes, getDeployedEntries, reconcileDeployedSafes, toSafeItems } from '../utils'
import type { BalanceMap, OverviewMap, SelectedSafe, SpaceSafeEntry } from '../types'

type SecurityHandle = ReturnType<typeof useLoadFeature<SecurityContract>>

export type ReconciledSpaceSafes = {
  isLoadingSpacesSafes: boolean
  safes: SpaceSafeEntry[]
  deployedEntries: SelectedSafe[]
  balanceMap: BalanceMap
  overviewMap: OverviewMap
}

/**
 * Fetches the Space's Safes, batches their overviews from CGW, and reconciles
 * "ghost-deployed" chains — entries flagged deployed locally but absent from
 * CGW's response (counterfactual for another Space member). The reconciled
 * `safes` and derived `deployedEntries` feed both the table and the scan queue.
 */
const useReconciledSpaceSafes = (security: SecurityHandle): ReconciledSpaceSafes => {
  const { allSafes, isLoading: isLoadingSpacesSafes } = useSpaceSafes()
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const currency = useAppSelector(selectCurrency)

  const rawSafes = useMemo(() => flattenSafes(allSafes, undeployedSafes), [allSafes, undeployedSafes])
  const safeItems = useMemo(() => toSafeItems(rawSafes), [rawSafes])

  const { data: overviews } = useGetMultipleSafeOverviewsQuery(
    { safes: safeItems, currency },
    { skip: safeItems.length === 0 },
  )

  const { confirmedDeployedKeys, balanceMap, overviewMap } = useMemo(() => {
    if (!security.$isReady || !overviews) {
      return { confirmedDeployedKeys: null, balanceMap: {} as BalanceMap, overviewMap: {} as OverviewMap }
    }

    const confirmed = new Set<string>()
    const { bMap, oMap } = overviews.reduce(
      (acc: { bMap: BalanceMap; oMap: OverviewMap }, ov) => {
        if (!ov.address?.value || !ov.chainId) {
          return acc
        }

        const key = security.scanKey(ov.address.value, ov.chainId)

        confirmed.add(key)

        acc.bMap[key] = ov.fiatTotal
        acc.oMap[key] = { balanceUsd: Number(ov.fiatTotal) || 0, queuedTxCount: ov.queued ?? 0 }

        return acc
      },
      { bMap: {}, oMap: {} },
    )

    return {
      confirmedDeployedKeys: confirmed.size > 0 ? confirmed : null,
      balanceMap: bMap,
      overviewMap: oMap,
    }
  }, [overviews, security.$isReady, security.scanKey])

  const safes = useMemo(
    () => (security.$isReady ? reconcileDeployedSafes(rawSafes, confirmedDeployedKeys, security.scanKey) : rawSafes),
    [rawSafes, confirmedDeployedKeys, security.$isReady, security.scanKey],
  )

  const deployedEntries = useMemo(() => getDeployedEntries(safes), [safes])

  return { isLoadingSpacesSafes, safes, deployedEntries, balanceMap, overviewMap }
}

export default useReconciledSpaceSafes
