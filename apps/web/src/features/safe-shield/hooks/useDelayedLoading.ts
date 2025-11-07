import { useEffect, useState } from 'react'

export const analysisVisibilityDelay = 500
export const contractDelay = 200
export const threatDelay = 400
export const simulationDelay = 600

/**
 * Calculates delay values for displaying different SafeShield analysis sections
 * in the UI, based on whether recipient and contract analysis sections are empty.
 *
 * @param recipientEmpty - True if recipient analysis data is empty.
 * @param contractEmpty - True if contract analysis data is empty.
 * @returns An object containing calculated delays (ms) for each analysis section.
 */
export const calculateAnalysisDelays = (recipientEmpty: boolean, contractEmpty: boolean) => {
  const recipientDelay = analysisVisibilityDelay

  let contractAnalysisDelay = contractDelay + analysisVisibilityDelay
  if (recipientEmpty) {
    contractAnalysisDelay = analysisVisibilityDelay
  }

  let threatAnalysisDelay = threatDelay
  if (contractEmpty || recipientEmpty) {
    threatAnalysisDelay = contractDelay
  }
  if (recipientEmpty) {
    threatAnalysisDelay += analysisVisibilityDelay
  }

  let simulationAnalysisDelay = simulationDelay
  if (contractEmpty || recipientEmpty) {
    simulationAnalysisDelay = threatDelay
  }
  if (recipientEmpty) {
    simulationAnalysisDelay += analysisVisibilityDelay
  }

  return {
    recipientDelay,
    contractAnalysisDelay,
    threatAnalysisDelay,
    simulationAnalysisDelay,
  }
}

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
