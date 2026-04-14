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
import type { ScanContext } from '@/features/security/data/scanners/types'
import type { SpaceSafeEntry, SelectedSafe } from '@/features/spaces/components/SecurityHub'

const useSafeScanContext = (selected: SelectedSafe | null, entry: SpaceSafeEntry | undefined): ScanContext | null => {
  const chainId = selected?.chainId ?? ''
  const address = selected?.address ?? ''
  const isMultichain = (entry?.chainEntries.length ?? 0) > 1
  const selectedChainEntry = entry?.chainEntries.find((c) => c.chainId === chainId)
  const isDeployed = selectedChainEntry?.isDeployed ?? false

  // Fetch SafeState for the selected chain — skip if not deployed
  const { currentData: safeInfo, isLoading: isSafeLoading } = useSafesGetSafeV1Query(
    { chainId, safeAddress: address },
    { skip: !selected || !isDeployed },
  )

  // Fetch master copies for deployer resolution
  const { currentData: masterCopies, isLoading: isMasterCopiesLoading } = useChainsGetMasterCopiesV1Query(
    { chainId },
    { skip: !selected || !isDeployed },
  )

  // Fetch creation transaction for factory/deployment validation
  const { currentData: creationTx, isLoading: isCreationLoading } = useTransactionsGetCreationTransactionV1Query(
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
  const { currentData: safeOverviews, isLoading: isOverviewsLoading } = useGetMultipleSafeOverviewsQuery(
    { safes: multichainSafeItems, currency },
    { skip: !isMultichain || multichainSafeItems.length === 0 },
  )

  // Fetch overview for balance data (fiatTotal) on the selected chain
  const { currentData: safeOverview, isLoading: isOverviewLoading } = useGetSafeOverviewQuery(
    { chainId, safeAddress: address },
    { skip: !selected || !isDeployed },
  )

  // --- TEMPORARY DIAGNOSTIC — remove before merge ---
  if (selected && safeOverview !== undefined) {
    console.warn('[Overview]', chainId, address.slice(0, 10), {
      fiatTotal: safeOverview?.fiatTotal,
      queued: safeOverview?.queued,
      raw: safeOverview,
    })
  }

  const chain = useChain(chainId)
  const latestVersion = getLatestSafeVersion(chain)
  const { configs: allChains } = useChains()

  return useMemo(() => {
    // Wait for ALL dependent queries — not just safeInfo. Returning a context before
    // overview/masterCopies/creationTx resolve causes scanners to run with defaults
    // (balanceUsd=0, deployer=null, creationInfo=null) producing incorrect scores.
    if (!selected || !entry || !safeInfo || isSafeLoading) return null
    if (isOverviewLoading || isMasterCopiesLoading || isCreationLoading) return null
    if (isMultichain && isOverviewsLoading) return null
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
      balanceUsd: Number(safeOverview?.fiatTotal) || 0,
      queuedTxCount: safeOverview?.queued ?? 0,
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

    // --- TEMPORARY DIAGNOSTIC — remove before merge ---
    console.warn('[ScanContext]', ctx.chainId, ctx.safeAddress.slice(0, 10), {
      threshold: ctx.threshold,
      owners: ctx.owners.length,
      version: ctx.version,
      latestVersion: ctx.latestVersion,
      implState: ctx.implementationVersionState,
      deployer: ctx.masterCopyDeployer,
      balanceUsd: ctx.balanceUsd,
      queued: ctx.queuedTxCount,
      guard: ctx.guard?.value?.slice(0, 10) ?? 'none',
      fallback: ctx.fallbackHandler?.value?.slice(0, 10) ?? 'none',
      modules: ctx.modules?.length ?? 0,
      recovery: ctx.chainSupportsRecovery,
      hypernative: ctx.chainSupportsHypernative,
      txScanning: ctx.chainSupportsTransactionScanning,
      multichain: ctx.isMultichain,
      consistent: ctx.multichainSignersConsistent,
      hasCreation: !!ctx.creationInfo,
    })

    return ctx
  }, [
    selected,
    entry,
    safeInfo,
    isSafeLoading,
    isOverviewLoading,
    isMasterCopiesLoading,
    isCreationLoading,
    isOverviewsLoading,
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
