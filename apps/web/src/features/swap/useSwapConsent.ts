import { useCallback } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { SWAPS_CONSENT_STORAGE_KEY } from './constants'

const useSwapConsent = (): {
  isConsentAccepted: boolean
  onAccept: () => void
} => {
  const [isConsentAccepted = false, setIsConsentAccepted] = useLocalStorage<boolean>(SWAPS_CONSENT_STORAGE_KEY)

  const onAccept = useCallback(() => {
    setIsConsentAccepted(true)
  }, [setIsConsentAccepted])

  return {
    isConsentAccepted,
    onAccept,
  }
}

export default useSwapConsent
