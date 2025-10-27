import { useState, useEffect } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import useBlockedAddress from '@/hooks/useBlockedAddress'

/**
 * Hook to check eligibility for No Fee November campaign
 *
 * Checks:
 * 1. Geofencing - user is not in OFAC sanctioned country
 * 2. Blacklist - Safe and wallet addresses are not on OFAC SDN list
 * 3. Backend eligibility - checks remaining free transactions
 *
 * TODO: Replace with real CGW endpoint when available
 * Expected endpoint: GET /v1/chains/{chainId}/relay/{safeAddress}/eligibility
 * Expected response: { isEligible: boolean, reason?: string }
 *
 * Note: This hook assumes it's only called when appropriate (Mainnet, deployed Safe)
 */
const useNoFeeNovemberEligibility = (): {
  isEligible: boolean | undefined
  remaining: number | undefined
  limit: number | undefined
  isLoading: boolean
  error: Error | undefined
  blockedAddress?: string
} => {
  const { safeAddress } = useSafeInfo()
  const blockedAddress = useBlockedAddress()
  const [isEligible, setIsEligible] = useState<boolean | undefined>(undefined)
  const [remaining, setRemaining] = useState<number | undefined>(undefined)
  const [limit, setLimit] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>(undefined)

  useEffect(() => {
    // If address is blocked, user is not eligible
    if (blockedAddress) {
      setIsEligible(false)
      setIsLoading(false)
      setRemaining(undefined)
      setLimit(undefined)
      return
    }

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

        // Mock data - randomly determine eligibility for demo purposes
        const mockEligible = Math.random() > 0.5

        setIsEligible(mockEligible)
        setRemaining(5) // mock value
        setLimit(5) // mock value
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
  }, [safeAddress, blockedAddress])

  return {
    isEligible,
    remaining,
    limit,
    isLoading,
    error,
    blockedAddress,
  }
}

export default useNoFeeNovemberEligibility
