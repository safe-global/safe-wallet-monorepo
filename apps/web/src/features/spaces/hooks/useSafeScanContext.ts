import { useMemo } from 'react'
import { type SafeItem } from '@/hooks/safes'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useChainsGetMasterCopiesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useTransactionsGetCreationTransactionV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useGetMultipleSafeOverviewsQuery, useGetSafeOverviewQuery } from '@/store/api/gateway'
import useChains, { useChain } from '@/hooks/useChains'
import { getLatestSafeVersion, isNonCriticalUpdate, hasFeature, FEATURES } from '@safe-global/utils/utils/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useAppSelector } from '@/store'
import { selectCurrency, selectUndeployedSafes } from '@/store/slices'
import { getSafeSetups, getSharedSetup, getDeviatingSetups } from '@/features/multichain/utils'
import type { ScanContext } from '@/features/security/types'
import type { SpaceSafeEntry, SelectedSafe } from '@/features/spaces/components/SecurityHub'

export type OverviewData = {
  balanceUsd: number
  queuedTxCount: number
}

const useSafeScanContext = (
  selected: SelectedSafe | null,
  entry: SpaceSafeEntry | undefined,
  overviewData?: OverviewData,
): ScanContext | null => {
  const chainId = selected?.chainId ?? ''
  const address = selected?.address ?? ''
  const isMultichain = (entry?.chainEntries.length ?? 0) > 1
  const selectedChainEntry = entry?.chainEntries.find((c) => c.chainId === chainId)
  const isDeployed = selectedChainEntry?.isDeployed ?? false

  // Fetch SafeState for the selected chain — skip if not deployed
  const { currentData: safeInfo, isFetching: isSafeFetching } = useSafesGetSafeV1Query(
    { chainId, safeAddress: address },
    { skip: !selected || !isDeployed },
  )

  // Fetch master copies for deployer resolution
  const {
    currentData: masterCopies,
    isFetching: isMasterCopiesFetching,
    isError: isMasterCopiesError,
  } = useChainsGetMasterCopiesV1Query({ chainId }, { skip: !selected || !isDeployed })

  // Fetch creation transaction for factory/deployment validation
  const {
    currentData: creationTx,
    isFetching: isCreationFetching,
    isError: isCreationError,
  } = useTransactionsGetCreationTransactionV1Query(
    { chainId, safeAddress: address },
    { skip: !selected || !isDeployed },
  )

  // For multichain: fetch overviews for all chains to compare signer setup
  const currency = useAppSelector(selectCurrency)
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const multichainSafeItems: SafeItem[] = useMemo(
    () =>
      isMultichain && entry
        ? entry.chainEntries
            .filter((c) => c.isDeployed)
            .map((c) => ({
              chainId: c.chainId,
              address: entry.address,
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            }))
        : [],
    [isMultichain, entry],
  )
  // Use `currentData` (not `data`) — `data` can briefly return the PREVIOUS Safe's overview
  // when useAutoScan advances from one Safe to the next, before RTK Query resolves the new args.
  const { currentData: safeOverviews, isFetching: isOverviewsFetching } = useGetMultipleSafeOverviewsQuery(
    { safes: multichainSafeItems, currency },
    { skip: !isMultichain || multichainSafeItems.length === 0 },
  )

  // Fetch overview for balance data (fiatTotal) on the selected chain.
  // Skip when pre-fetched overviewData is provided (e.g. from the batch query in SecurityHub)
  // to avoid redundant per-Safe API requests during auto-scan.
  const { currentData: safeOverview, isFetching: isOverviewFetching } = useGetSafeOverviewQuery(
    { chainId, safeAddress: address },
    { skip: !selected || !isDeployed || !!overviewData },
  )

  const chain = useChain(chainId)
  const latestVersion = getLatestSafeVersion(chain)
  const { configs: allChains } = useChains()

  return useMemo(() => {
    // Wait for ALL dependent queries to FULLY settle — not just stop initial loading.
    // `isLoading` is only true on the very first fetch and there are windows
    // (uninitialized → pending transition, errored args, re-fetches) where
    // `isLoading=false` while `currentData` is still undefined. Scanners launched in
    // one of those windows run with `creationInfo=null` and produce the misleading
    // "creation data not yet available" result, then flip on the next rescan when
    // the underlying query has finally populated data. Using `isFetching` catches
    // both initial fetches and refetches; we additionally require data to be
    // present unless the query has definitively errored (in which case the scanner
    // handles missing data with `inconclusive`).
    if (!selected || !entry) return null
    if (isSafeFetching || !safeInfo) return null
    if (!overviewData && isOverviewFetching) return null
    if (isMasterCopiesFetching || (!masterCopies && !isMasterCopiesError)) return null
    if (isCreationFetching || (!creationTx && !isCreationError)) return null
    if (isMultichain && (isOverviewsFetching || !safeOverviews)) return null
    // Chain config must be loaded — otherwise feature flags (recovery, hypernative,
    // transaction scanning) all default to false, producing wrong scanner results.
    if (!chain) return null

    // Resolve deployer using the same logic as useMasterCopies + OutdatedMastercopyWarning
    const matchingMc = masterCopies?.find((mc) => sameAddress(mc.address, safeInfo.implementation.value))
    const isCircles = matchingMc?.version?.toLowerCase().includes('circles') ?? false
    const deployer: 'Gnosis' | 'Circles' | null = matchingMc ? (isCircles ? 'Circles' : 'Gnosis') : null

    // Compute multichain signer consistency using the same utils as InconsistentSignerSetupWarning
    let multichainSignersConsistent = true
    let multichainDeviatingChains: string[] = []
    if (isMultichain && safeOverviews && safeOverviews.length > 0) {
      const safeSetups = getSafeSetups(multichainSafeItems, safeOverviews, undeployedSafes)
      const sharedSetup = getSharedSetup(safeSetups)
      multichainSignersConsistent = sharedSetup !== undefined

      if (!multichainSignersConsistent) {
        const deviating = getDeviatingSetups(safeSetups, selected.chainId)
        multichainDeviatingChains = deviating.map((setup) => {
          const chainConfig = allChains.find((c) => c.chainId === setup.chainId)
          return chainConfig?.chainName ?? `Chain ${setup.chainId}`
        })
      }
    }

    const ctx = {
      owners: safeInfo.owners,
      threshold: safeInfo.threshold,
      modules: safeInfo.modules ?? null,
      guard: safeInfo.guard ?? null,
      fallbackHandler: safeInfo.fallbackHandler ?? null,
      implementationVersionState: safeInfo.implementationVersionState,
      implementationAddress: safeInfo.implementation.value,
      version: safeInfo.version ?? null,
      latestVersion,
      isNonCriticalUpdate: !!isNonCriticalUpdate(safeInfo.version),
      masterCopyDeployer: deployer,
      chainId: selected.chainId,
      safeAddress: selected.address,
      nonce: safeInfo.nonce,
      balanceUsd: overviewData?.balanceUsd ?? (Number(safeOverview?.fiatTotal) || 0),
      queuedTxCount: overviewData?.queuedTxCount ?? safeOverview?.queued ?? 0,
      chainSupportsRecovery: chain ? hasFeature(chain, FEATURES.RECOVERY) : false,
      chainSupportsHypernative: chain ? hasFeature(chain, FEATURES.HYPERNATIVE) : false,
      chainSupportsTransactionScanning: chain ? hasFeature(chain, FEATURES.RISK_MITIGATION) : false,
      isMultichain,
      multichainSignersConsistent,
      multichainDeviatingChains,
      creationInfo: creationTx
        ? {
            factoryAddress: creationTx.factoryAddress ?? null,
            creator: creationTx.creator,
            masterCopy: creationTx.masterCopy ?? null,
            transactionHash: creationTx.transactionHash,
          }
        : null,
    }

    return ctx
  }, [
    selected,
    entry,
    safeInfo,
    isSafeFetching,
    overviewData,
    isOverviewFetching,
    isMasterCopiesFetching,
    isMasterCopiesError,
    isCreationFetching,
    isCreationError,
    isOverviewsFetching,
    chain,
    masterCopies,
    latestVersion,
    isMultichain,
    safeOverview,
    safeOverviews,
    multichainSafeItems,
    undeployedSafes,
    allChains,
    creationTx,
  ])
}

export default useSafeScanContext
