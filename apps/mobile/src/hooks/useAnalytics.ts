import { useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { setChainId, setSafeAddress } from '@/src/services/analytics'

export const useAnalytics = () => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const params = useLocalSearchParams<{
    safeAddress?: string
    chainId?: string
  }>()

  // Determine which safe to use - route params override activeSafe
  const currentSafeAddress = params.safeAddress || activeSafe?.address
  const currentChainId = params.chainId || activeSafe?.chainId

  // Set chain ID when it changes
  useEffect(() => {
    if (currentChainId) {
      setChainId(currentChainId)
    }
  }, [currentChainId])

  // Set safe address when it changes
  useEffect(() => {
    if (currentSafeAddress) {
      setSafeAddress(currentSafeAddress)
    }
  }, [currentSafeAddress])

  return {
    safeAddress: currentSafeAddress,
    chainId: currentChainId,
    isUsingRouteParams: !!(params.safeAddress || params.chainId),
  }
}
