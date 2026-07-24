import { useMemo } from 'react'
import type { SafeVersion } from '@safe-global/types-kit'
import type { ImplementationVersionState } from '@safe-global/store/gateway/types'
import {
  getMastercopyAction,
  isValidMasterCopy,
  type MastercopyAction,
} from '@safe-global/utils/services/contracts/safeContracts'
import { getLatestSafeVersion, isNonCriticalUpdate } from '@safe-global/utils/utils/chains'
import { isValidSafeVersion } from '@safe-global/utils/services/contracts/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import { MasterCopyDeployer, useMasterCopies } from '@/hooks/useMasterCopies'
import { useBytecodeComparison } from '@/hooks/useBytecodeComparison'

export type MastercopyMigration = {
  state: ImplementationVersionState
  action: MastercopyAction
  isCritical: boolean
  isOfficialDeployer: boolean
  isSupportedVersion: boolean
  latestVersion: SafeVersion
  changelogUrl?: string
  isBytecodeLoading: boolean
}

/**
 * Combines every fact the mastercopy surfaces need in one place so no surface
 * re-derives them from the raw `safe` object. `action` reflects availability only;
 * `isCritical`/`isOfficialDeployer`/`isSupportedVersion` let each consumer keep its
 * own nag policy.
 */
export const useMastercopyMigration = (): MastercopyMigration => {
  const { safe } = useSafeInfo()
  const [masterCopies] = useMasterCopies()
  const currentChain = useCurrentChain()
  const bytecodeComparison = useBytecodeComparison()

  const safeMasterCopy = useMemo(
    () => masterCopies?.find((mc) => sameAddress(mc.address, safe.implementation.value)),
    [masterCopies, safe.implementation.value],
  )

  return useMemo(() => {
    const latestVersion = getLatestSafeVersion(currentChain)

    return {
      state: safe.implementationVersionState as ImplementationVersionState,
      action: getMastercopyAction(safe, {
        bytecodeResult: bytecodeComparison.result,
        recommendedVersion: latestVersion,
      }),
      isCritical: !isNonCriticalUpdate(safe.version),
      isOfficialDeployer: safeMasterCopy?.deployer === MasterCopyDeployer.GNOSIS,
      isSupportedVersion: isValidSafeVersion(safe.version),
      latestVersion,
      changelogUrl: safeMasterCopy?.deployerRepoUrl,
      // A valid mastercopy never triggers a bytecode comparison, so it can never be "loading".
      isBytecodeLoading: !isValidMasterCopy(safe.implementationVersionState) && bytecodeComparison.isLoading,
    }
  }, [safe, safeMasterCopy, currentChain, bytecodeComparison.result, bytecodeComparison.isLoading])
}
