import { useEffect } from 'react'
import { registerServiceWorker } from '@/services/pwa/registerServiceWorker'

/**
 * Registers the PWA service worker once on mount. See `registerServiceWorker`
 * for why this is done ourselves instead of relying on next-pwa's auto-register.
 */
export const useRegisterServiceWorker = (): void => {
  useEffect(() => {
    registerServiceWorker()
  }, [])
}
