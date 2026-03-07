import { useEffect, useState } from 'react'

export const analysisVisibilityDelay = 500
export const contractDelay = 200
export const deadlockDelay = 300
export const threatDelay = 400
export const simulationDelay = 600

/**
 * Calculates delay values for displaying different SafeShield analysis sections
 * in the UI, based on whether recipient, contract, and deadlock analysis sections are empty.
 *
 * @param recipientEmpty - True if recipient analysis data is empty.
 * @param contractEmpty - True if contract analysis data is empty.
 * @param deadlockEmpty - True if deadlock analysis data is empty.
 * @returns An object containing calculated delays (ms) for each analysis section.
 */
export const calculateAnalysisDelays = (
  recipientEmpty: boolean,
  contractEmpty: boolean,
  deadlockEmpty: boolean = true,
) => {
  const recipientDelay = 300

  let contractAnalysisDelay = contractDelay + analysisVisibilityDelay
  if (recipientEmpty) {
    contractAnalysisDelay = analysisVisibilityDelay
  }

  let deadlockAnalysisDelay = deadlockDelay + analysisVisibilityDelay
  if (contractEmpty || recipientEmpty) {
    deadlockAnalysisDelay = contractDelay + analysisVisibilityDelay
  }
  if (recipientEmpty) {
    deadlockAnalysisDelay = analysisVisibilityDelay
  }

  let threatAnalysisDelay = threatDelay
  if ((contractEmpty || recipientEmpty) && deadlockEmpty) {
    threatAnalysisDelay = contractDelay
  }
  if (!deadlockEmpty) {
    threatAnalysisDelay = deadlockDelay + analysisVisibilityDelay
  }
  if (recipientEmpty && deadlockEmpty) {
    threatAnalysisDelay += analysisVisibilityDelay
  }

  let simulationAnalysisDelay = simulationDelay
  if ((contractEmpty || recipientEmpty) && deadlockEmpty) {
    simulationAnalysisDelay = threatDelay
  }
  if (recipientEmpty && deadlockEmpty) {
    simulationAnalysisDelay += analysisVisibilityDelay
  }

  return {
    recipientDelay,
    contractAnalysisDelay,
    deadlockAnalysisDelay,
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
