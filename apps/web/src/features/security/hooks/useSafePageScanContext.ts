import { useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useMasterCopies } from '@/hooks/useMasterCopies'
import { useCurrentChain } from '@/hooks/useChains'
import useChains from '@/hooks/useChains'
import { type SafeItem, useAllSafesGrouped } from '@/hooks/safes'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency, selectUndeployedSafes } from '@/store/slices'
import { getLatestSafeVersion, isNonCriticalUpdate, hasFeature, FEATURES } from '@safe-global/utils/utils/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useIsMultichainSafe } from '@/features/multichain/hooks/useIsMultichainSafe'
import { getSafeSetups, getSharedSetup, getDeviatingSetups } from '@/features/multichain/utils'
import { useGetSafeOverviewQuery } from '@/store/api/gateway'
import { useTransactionsGetCreationTransactionV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useUrlChainId } from '@/hooks/useChainId'
import type { ScanContext } from '@/features/security/data/scanners/types'

/**
 * Builds a ScanContext for the current Safe page.
 * Uses useSafeInfo() for Safe data + multichain consistency check via SafeOverview API.
 */
const useSafePageScanContext = (): ScanContext | null => {
  const { safe, safeAddress, safeLoaded, safeLoading } = useSafeInfo()
  const urlAddress = useSafeAddressFromUrl()
  const urlChainId = useUrlChainId()
  const [masterCopies] = useMasterCopies()
  const chain = useCurrentChain()
  const isMultichain = useIsMultichainSafe() ?? false
  const latestVersion = getLatestSafeVersion(chain)
  const { currentData: safeOverview } = useGetSafeOverviewQuery(
    { chainId: safe.chainId, safeAddress: safe.address.value },
    { skip: !safeLoaded },
  )

  // Fetch creation transaction for factory/deployment validation
  const { currentData: creationTx } = useTransactionsGetCreationTransactionV1Query(
    { chainId: safe.chainId, safeAddress: safe.address.value },
    { skip: !safeLoaded },
  )

  // Multichain consistency check — same approach as Spaces useSafeScanContext
  const { allMultiChainSafes } = useAllSafesGrouped()
  const currency = useAppSelector(selectCurrency)
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const { configs: allChains } = useChains()

  const multichainSafeItems: SafeItem[] = useMemo(() => {
    if (!isMultichain || !safeAddress) return []
    const group = allMultiChainSafes?.find((m) => sameAddress(m.address, safeAddress))
    if (!group) return []
    return group.safes.filter((s) => !undeployedSafes[s.chainId]?.[s.address])
  }, [isMultichain, safeAddress, allMultiChainSafes, undeployedSafes])

  const { currentData: safeOverviews } = useGetMultipleSafeOverviewsQuery(
    { safes: multichainSafeItems, currency },
    { skip: !isMultichain || multichainSafeItems.length === 0 },
  )

  return useMemo(() => {
    if (!safeLoaded || !safe || safeLoading) return null
    if (urlAddress && !sameAddress(safeAddress, urlAddress)) return null
    if (urlChainId && safe.chainId !== urlChainId) return null
    // Wait for overview data so balanceUsd and queuedTxCount are accurate on first scan
    if (!safeOverview) return null
    // Wait for multichain overview data before building context
    if (isMultichain && multichainSafeItems.length > 0 && !safeOverviews) return null

    // Resolve deployer
    const matchingMc = masterCopies?.find((mc) => sameAddress(mc.address, safe.implementation.value))
    const isCircles = matchingMc?.version?.toLowerCase().includes('circles') ?? false
    const deployer: 'Gnosis' | 'Circles' | null = matchingMc ? (isCircles ? 'Circles' : 'Gnosis') : null

    // Compute multichain signer consistency
    let multichainSignersConsistent = true
    let multichainDeviatingChains: string[] = []
    if (isMultichain && safeOverviews && safeOverviews.length > 0) {
      const safeSetups = getSafeSetups(multichainSafeItems, safeOverviews, undeployedSafes)
      const sharedSetup = getSharedSetup(safeSetups)
      multichainSignersConsistent = sharedSetup !== undefined

      if (!multichainSignersConsistent) {
        const deviating = getDeviatingSetups(safeSetups, safe.chainId)
        multichainDeviatingChains = deviating.map((setup) => {
          const chainConfig = allChains.find((c) => c.chainId === setup.chainId)
          return chainConfig?.chainName ?? `Chain ${setup.chainId}`
        })
      }
    }

    return {
      owners: safe.owners,
      threshold: safe.threshold,
      modules: safe.modules ?? null,
      guard: safe.guard ?? null,
      fallbackHandler: safe.fallbackHandler ?? null,
      implementationVersionState: safe.implementationVersionState,
      implementationAddress: safe.implementation.value,
      version: safe.version ?? null,
      latestVersion,
      isNonCriticalUpdate: !!isNonCriticalUpdate(safe.version),
      masterCopyDeployer: deployer,
      chainId: safe.chainId,
      safeAddress: safe.address.value,
      nonce: safe.nonce,
      balanceUsd: Number(safeOverview?.fiatTotal) || 0,
      // TODO: wire real data when these scanners are activated
      addressBookEntryCount: 0,
      queuedTxCount: safeOverview?.queued ?? 0,
      chainSupportsRecovery: chain ? hasFeature(chain, FEATURES.RECOVERY) : false,
      chainSupportsHypernative: chain ? hasFeature(chain, FEATURES.HYPERNATIVE) : false,
      chainSupportsTransactionScanning: chain ? hasFeature(chain, FEATURES.RISK_MITIGATION) : false,
      isTrustedSafe: false,
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
  }, [
    safe,
    safeAddress,
    safeLoaded,
    safeLoading,
    urlAddress,
    urlChainId,
    masterCopies,
    latestVersion,
    chain,
    isMultichain,
    safeOverview,
    safeOverviews,
    multichainSafeItems,
    undeployedSafes,
    allChains,
    creationTx,
  ])
}

export default useSafePageScanContext
