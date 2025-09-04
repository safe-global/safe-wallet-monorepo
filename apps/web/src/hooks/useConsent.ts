import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useCallback } from 'react'

const useConsent = (storageKey: string) => {
  const [isConsentAccepted = false, setIsConsentAccepted] = useLocalStorage<boolean>(storageKey)

  const onAccept = useCallback(() => {
    setIsConsentAccepted(true)
  }, [setIsConsentAccepted])

  return {
    isConsentAccepted,
    onAccept,
  }
}

export default useConsent
