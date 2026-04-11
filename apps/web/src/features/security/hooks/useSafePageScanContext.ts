import { useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useMasterCopies } from '@/hooks/useMasterCopies'
import { useCurrentChain } from '@/hooks/useChains'
import { getLatestSafeVersion, isNonCriticalUpdate, hasFeature, FEATURES } from '@safe-global/utils/utils/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useIsMultichainSafe } from '@/features/multichain/hooks/useIsMultichainSafe'
import type { ScanContext } from '@/features/security/data/scanners/types'

/**
 * Builds a ScanContext for the current Safe page.
 * Uses useSafeInfo() which has all data already available in the Safe context.
 * Much simpler than the Spaces version (useSafeScanContext) which uses RTK Query.
 */
const useSafePageScanContext = (): ScanContext | null => {
  const { safe, safeLoaded } = useSafeInfo()
  const [masterCopies] = useMasterCopies()
  const chain = useCurrentChain()
  const isMultichain = useIsMultichainSafe() ?? false
  const latestVersion = getLatestSafeVersion(chain)

  return useMemo(() => {
    if (!safeLoaded || !safe) return null

    // Resolve deployer — same logic as Spaces version
    const matchingMc = masterCopies?.find((mc) => sameAddress(mc.address, safe.implementation.value))
    const isCircles = matchingMc?.version?.toLowerCase().includes('circles') ?? false
    const deployer: 'Gnosis' | 'Circles' | null = matchingMc ? (isCircles ? 'Circles' : 'Gnosis') : null

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
      // TODO: wire real data when these scanners are activated
      addressBookEntryCount: 0,
      queuedTxCount: 0,
      chainSupportsRecovery: chain ? hasFeature(chain, FEATURES.RECOVERY) : false,
      isTrustedSafe: false,
      isMultichain,
      multichainSignersConsistent: true,
      multichainDeviatingChains: [],
    }
  }, [safe, safeLoaded, masterCopies, latestVersion, chain, isMultichain])
}

export default useSafePageScanContext
