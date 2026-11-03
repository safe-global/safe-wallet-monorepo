import { useEffect, useState } from 'react'

export const analysisVisibilityDelay = 500

/**
 * Hook that delays the visibility of loading state transitions
 * @param loading - The actual loading state
 * @param delay - Delay in milliseconds before hiding the loading state (default: 500ms)
 * @returns isLoadingVisible - The delayed loading state
 */
export const useDelayedLoading = (loading: boolean, delay = 500): boolean => {
  const [isLoadingVisible, setIsLoadingVisible] = useState(false)

  useEffect(() => {
    if (loading) {
      setIsLoadingVisible(true)
      return
    }

    const timeoutId = setTimeout(() => {
      setIsLoadingVisible(false)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [loading, delay])

  return isLoadingVisible
}
