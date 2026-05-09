import { useEffect, useState } from 'react'
import { useWeb3ReadOnly } from './wallets/web3'
import useSafeInfo from './useSafeInfo'
import {
  compareWithSupportedL2Contracts,
  isSupportedL2Version,
} from '@safe-global/utils/services/contracts/bytecodeComparison'
import type { BytecodeComparisonResult } from '@safe-global/utils/services/contracts/bytecodeComparison'
import { isValidMasterCopy } from '@safe-global/utils/services/contracts/safeContracts'
import { Gnosis_safe__factory } from '@safe-global/utils/types/contracts'

export type BytecodeComparisonState = {
  result?: BytecodeComparisonResult
  isLoading: boolean
}

/**
 * Hook to fetch and compare bytecode of an unsupported mastercopy
 * with official L2 deployments for migration purposes
 *
 * @returns BytecodeComparisonState with result and loading status
 */
export const useBytecodeComparison = (): BytecodeComparisonState => {
  const { safe } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()
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

      setIsLoading(true)

      try {
        // If version is not available from gateway, fetch it from the contract
        let safeVersion = safe.version
        if (!safeVersion) {
          const safeContract = Gnosis_safe__factory.connect(safe.address.value, web3ReadOnly)
          safeVersion = await safeContract.VERSION()
        }

        // Only compare for supported L2 versions (1.3.0+L2 and 1.4.1+L2)
        if (!safeVersion) {
          setComparisonResult(undefined)
          setIsLoading(false)
          return
        }

        const isSupported = isSupportedL2Version(safeVersion)

        if (!isSupported) {
          setComparisonResult(undefined)
          setIsLoading(false)
          return
        }

        if (!safe.implementation?.value) {
          setComparisonResult(undefined)
          setIsLoading(false)
          return
        }

        const implementationAddress = safe.implementation.value
        const bytecode = await web3ReadOnly.getCode(implementationAddress)

        const result = await compareWithSupportedL2Contracts(bytecode, safe.chainId)
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
  ])

  return { result: comparisonResult, isLoading }
}
