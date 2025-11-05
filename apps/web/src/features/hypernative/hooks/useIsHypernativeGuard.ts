import { useEffect, useState } from 'react'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isHypernativeGuard } from '../services/hypernativeGuardCheck'

export type HypernativeGuardCheckResult = {
  isHypernativeGuard: boolean
  loading: boolean
}

/**
 * Hook to check if the current Safe has a HypernativeGuard installed
 *
 * @returns HypernativeGuardCheckResult with isHypernativeGuard flag and loading state
 */
export const useIsHypernativeGuard = (): HypernativeGuardCheckResult => {
  const { safe, safeLoaded } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()
  const [isHnGuard, setIsHnGuard] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkGuard = async () => {
      // Don't check if Safe is not loaded yet
      if (!safeLoaded) {
        setLoading(true)
        return
      }

      // If there's no guard, we know it's not a HypernativeGuard
      if (!safe.guard) {
        setIsHnGuard(false)
        setLoading(false)
        return
      }

      // If we don't have a provider yet, wait
      if (!web3ReadOnly) {
        setLoading(true)
        return
      }

      setLoading(true)

      try {
        const result = await isHypernativeGuard(safe.guard.value, web3ReadOnly)
        setIsHnGuard(result)
      } catch (error) {
        console.error('[useIsHypernativeGuard] Error checking guard:', error)
        setIsHnGuard(false)
      } finally {
        setLoading(false)
      }
    }

    checkGuard()
  }, [safe.guard, safeLoaded, web3ReadOnly])

  return {
    isHypernativeGuard: isHnGuard,
    loading,
  }
}
