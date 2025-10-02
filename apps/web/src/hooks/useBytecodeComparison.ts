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
      console.log('[useBytecodeComparison] Starting check...')
      console.log('[useBytecodeComparison] Safe version from gateway:', safe.version)
      console.log('[useBytecodeComparison] Implementation state:', safe.implementationVersionState)
      console.log('[useBytecodeComparison] Web3 provider available:', !!web3ReadOnly)

      // Only compare if mastercopy is unsupported
      if (isValidMasterCopy(safe.implementationVersionState)) {
        console.log('[useBytecodeComparison] Mastercopy is valid, skipping')
        setComparisonResult(undefined)
        setIsLoading(false)
        return
      }

      // Need web3 provider to fetch bytecode
      if (!web3ReadOnly) {
        console.log('[useBytecodeComparison] No web3 provider, waiting...')
        setIsLoading(true)
        return
      }

      setIsLoading(true)

      try {
        // If version is not available from gateway, fetch it from the contract
        let safeVersion = safe.version
        if (!safeVersion) {
          console.log('[useBytecodeComparison] No version from gateway, fetching from contract...')
          const safeContract = Gnosis_safe__factory.connect(safe.address.value, web3ReadOnly)
          safeVersion = await safeContract.VERSION()
          console.log('[useBytecodeComparison] Version from contract:', safeVersion)
        }

        // Only compare for supported L2 versions (1.3.0+L2 and 1.4.1+L2)
        if (!safeVersion) {
          console.log('[useBytecodeComparison] No version found, skipping')
          setComparisonResult(undefined)
          setIsLoading(false)
          return
        }

        const isSupported = isSupportedL2Version(safeVersion)
        console.log('[useBytecodeComparison] Is supported L2 version:', isSupported)

        if (!isSupported) {
          console.log('[useBytecodeComparison] Version not supported, skipping')
          setComparisonResult(undefined)
          setIsLoading(false)
          return
        }

        if (!safe.implementation?.value) {
          console.log('[useBytecodeComparison] No implementation address, skipping')
          setComparisonResult(undefined)
          setIsLoading(false)
          return
        }

        const implementationAddress = safe.implementation.value
        console.log('[useBytecodeComparison] Fetching bytecode for', implementationAddress, 'on chain', safe.chainId)
        const bytecode = await web3ReadOnly.getCode(implementationAddress)
        console.log('[useBytecodeComparison] Bytecode length:', bytecode.length)

        console.log('[useBytecodeComparison] Comparing bytecode hash...')
        const result = await compareWithSupportedL2Contracts(bytecode, safe.chainId)
        console.log('[useBytecodeComparison] Comparison result:', result)
        setComparisonResult(result)
        setIsLoading(false)
      } catch (error) {
        console.error('[useBytecodeComparison] Error:', error)
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
