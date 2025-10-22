import { useState, useEffect } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'

/**
 * Hook to check eligibility for No Fee November campaign and get remaining free transactions
 *
 * TODO: Replace with real CGW endpoint when available
 * Expected endpoint: GET /v1/chains/{chainId}/relay/{safeAddress}/eligibility
 * Expected response: { isEligible: boolean, remaining: number, limit: number, reason?: string }
 *
 * Note: This hook assumes it's only called when appropriate (Mainnet, deployed Safe)
 */
const useNoFeeNovemberEligibility = (): {
  isEligible: boolean | undefined
  remaining: number | undefined
  limit: number | undefined
  isLoading: boolean
  error: Error | undefined
} => {
  const { safeAddress } = useSafeInfo()
  const [isEligible, setIsEligible] = useState<boolean | undefined>(undefined)
  const [remaining, setRemaining] = useState<number | undefined>(undefined)
  const [limit, setLimit] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>(undefined)

  useEffect(() => {
    // Mock API call to CGW eligibility endpoint
    const checkEligibility = async () => {
      setIsLoading(true)
      setError(undefined)

      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock response - replace with real CGW call when available
        // const response = await fetch(`/v1/chains/${safe.chainId}/relay/${safeAddress}/eligibility`)
        // const data = await response.json()

        // Mock data
        const mockEligible = true
        const mockLimit = 5
        const mockRemaining = 1

        setIsEligible(mockEligible)
        setRemaining(mockRemaining)
        setLimit(mockLimit)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to check eligibility'))
        setIsLoading(false)
      }
    }

    if (safeAddress) {
      checkEligibility()
    } else {
      setIsLoading(false)
      setIsEligible(undefined)
      setRemaining(undefined)
      setLimit(undefined)
    }
  }, [safeAddress])

  return {
    isEligible,
    remaining,
    limit,
    isLoading,
    error,
  }
}

export default useNoFeeNovemberEligibility
