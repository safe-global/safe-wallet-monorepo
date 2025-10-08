import { useEffect } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useChainId from '@/hooks/useChainId'
import { analyzeAddressActivity, type AddressActivityAssessment } from './addressActivityService'

/**
 * React hook to analyze address activity
 * @param address - Ethereum address to analyze
 * @returns Object containing activity assessment, loading state, and error
 */
export const useAddressActivity = (
  address: string | undefined,
): {
  assessment?: AddressActivityAssessment
  loading: boolean
  error?: Error
} => {
  const web3ReadOnly = useWeb3ReadOnly()
  const chainId = useChainId()

  const [assessment, error, loading] = useAsync<AddressActivityAssessment | undefined>(async () => {
    if (!address || !web3ReadOnly) {
      return undefined
    }

    return analyzeAddressActivity(address, web3ReadOnly)
  }, [address, web3ReadOnly, chainId])

  useEffect(() => {
    if (error) {
      console.error('Address activity analysis error:', error)
    }
  }, [error])

  return {
    assessment,
    loading,
    error,
  }
}
