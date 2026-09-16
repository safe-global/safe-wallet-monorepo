import { skipToken } from '@reduxjs/toolkit/query'
import { useWeb3ReadOnly } from './wallets/web3'
import useSafeInfo from './useSafeInfo'
import { useCurrentChain } from './useChains'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import {
  compareWithOfficialSingletons,
  isSupportedMigrationVersion,
} from '@safe-global/utils/services/contracts/bytecodeComparison'
import type { BytecodeComparisonResult } from '@safe-global/utils/services/contracts/bytecodeComparison'
import { isValidMasterCopy } from '@safe-global/utils/services/contracts/safeContracts'
import { Gnosis_safe__factory } from '@safe-global/utils/types/contracts'
import { useGetCodeQuery } from '@/store/api/rpc'

export type BytecodeComparisonState = {
  result?: BytecodeComparisonResult
  isLoading: boolean
}

/**
 * Hook to fetch and compare the bytecode of an unsupported mastercopy against the
 * official Safe singletons for migration purposes.
 */
export const useBytecodeComparison = (): BytecodeComparisonState => {
  const { safe } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()
  const currentChain = useCurrentChain()
  const recommendedVersion = getLatestSafeVersion(currentChain)

  const isUnsupportedMasterCopy = !isValidMasterCopy(safe.implementationVersionState)
  const implementationAddress = safe.implementation?.value

  const [fetchedVersion, , isVersionLoading] = useAsync(async () => {
    if (!isUnsupportedMasterCopy || safe.version || !web3ReadOnly) return undefined
    return Gnosis_safe__factory.connect(safe.address.value, web3ReadOnly).VERSION()
  }, [isUnsupportedMasterCopy, safe.version, safe.address.value, web3ReadOnly])

  const safeVersion = safe.version ?? fetchedVersion

  const canCompare =
    isUnsupportedMasterCopy &&
    !!implementationAddress &&
    !!safeVersion &&
    isSupportedMigrationVersion(safeVersion, recommendedVersion)

  const {
    data: bytecode,
    isLoading: isCodeLoading,
    isError,
  } = useGetCodeQuery(
    canCompare && implementationAddress ? { chainId: safe.chainId, address: implementationAddress } : skipToken,
  )

  const [comparison, , isComparing] = useAsync(async () => {
    if (!canCompare || bytecode === undefined) return undefined
    return compareWithOfficialSingletons(bytecode, recommendedVersion)
  }, [canCompare, bytecode, recommendedVersion])

  const result = canCompare && isError ? { isMatch: false } : comparison

  return {
    result,
    isLoading:
      isUnsupportedMasterCopy &&
      (!web3ReadOnly || isVersionLoading || (canCompare && !isError && (isCodeLoading || isComparing))),
  }
}
