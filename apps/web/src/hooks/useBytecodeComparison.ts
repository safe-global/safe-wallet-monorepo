import { useEffect, useState } from 'react'
import { useWeb3ReadOnly } from './wallets/web3'
import useSafeInfo from './useSafeInfo'
import { useCurrentChain } from './useChains'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import {
  compareWithOfficialSingletons,
  isSupportedMigrationVersion,
} from '@safe-global/utils/services/contracts/bytecodeComparison'
import type { BytecodeComparisonResult } from '@safe-global/utils/services/contracts/bytecodeComparison'
import { isValidMasterCopy } from '@safe-global/utils/services/contracts/safeContracts'
import { Gnosis_safe__factory } from '@safe-global/utils/types/contracts'

export type BytecodeComparisonState = {
  result?: BytecodeComparisonResult
  isLoading: boolean
}

type Web3ReadOnly = NonNullable<ReturnType<typeof useWeb3ReadOnly>>

// An implementation's bytecode is immutable, so its comparison result is memoised per
// `${chainId}:${implementation}` for the session. `inFlight` additionally coalesces
// concurrent consumers (the settings page renders two) so getCode runs at most once.
const resultCache = new Map<string, BytecodeComparisonResult>()
const inFlight = new Map<string, Promise<BytecodeComparisonResult>>()

/** Test-only: clears the module-level caches so mocked providers/addresses don't leak between tests. */
export const _resetBytecodeComparisonCache = (): void => {
  resultCache.clear()
  inFlight.clear()
}

const resolveComparison = (
  provider: Web3ReadOnly,
  key: string,
  implementationAddress: string,
  recommendedVersion: string,
): Promise<BytecodeComparisonResult> => {
  const existing = inFlight.get(key)
  if (existing) return existing

  const promise = provider
    .getCode(implementationAddress)
    .then((bytecode) => compareWithOfficialSingletons(bytecode, recommendedVersion))
    .then((result) => {
      resultCache.set(key, result)
      inFlight.delete(key)
      return result
    })
    .catch((error) => {
      inFlight.delete(key)
      throw error
    })

  inFlight.set(key, promise)
  return promise
}

/**
 * Hook to fetch and compare the bytecode of an unsupported mastercopy against the
 * official Safe singletons for migration purposes.
 *
 * @returns BytecodeComparisonState with result and loading status
 */
export const useBytecodeComparison = (): BytecodeComparisonState => {
  const { safe } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()
  const currentChain = useCurrentChain()
  const recommendedVersion = getLatestSafeVersion(currentChain)
  const [comparisonResult, setComparisonResult] = useState<BytecodeComparisonResult | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchAndCompare = async () => {
      // Only compare if mastercopy is unsupported
      if (isValidMasterCopy(safe.implementationVersionState)) {
        setComparisonResult(undefined)
        setIsLoading(false)
        return
      }

      // Need web3 provider to fetch bytecode
      if (!web3ReadOnly) {
        setIsLoading(true)
        return
      }

      const implementationAddress = safe.implementation?.value

      // Cache hit: resolve synchronously without an RPC round-trip.
      if (implementationAddress) {
        const cached = resultCache.get(`${safe.chainId}:${implementationAddress}:${recommendedVersion}`)
        if (cached) {
          setComparisonResult(cached)
          setIsLoading(false)
          return
        }
      }

      setIsLoading(true)

      try {
        // If version is not available from gateway, fetch it from the contract
        let safeVersion = safe.version
        if (!safeVersion) {
          const safeContract = Gnosis_safe__factory.connect(safe.address.value, web3ReadOnly)
          safeVersion = await safeContract.VERSION()
        }

        if (!safeVersion || !isSupportedMigrationVersion(safeVersion, recommendedVersion) || !implementationAddress) {
          setComparisonResult(undefined)
          setIsLoading(false)
          return
        }

        const result = await resolveComparison(
          web3ReadOnly,
          `${safe.chainId}:${implementationAddress}:${recommendedVersion}`,
          implementationAddress,
          recommendedVersion,
        )
        setComparisonResult(result)
        setIsLoading(false)
      } catch (error) {
        setComparisonResult({ isMatch: false })
        setIsLoading(false)
      }
    }

    fetchAndCompare()
  }, [
    safe.implementationVersionState,
    safe.implementation?.value,
    safe.chainId,
    safe.version,
    safe.address.value,
    web3ReadOnly,
    recommendedVersion,
  ])

  return { result: comparisonResult, isLoading }
}
