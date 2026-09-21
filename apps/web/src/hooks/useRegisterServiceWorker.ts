import { useEffect } from 'react'
import { registerServiceWorker } from '@/services/pwa/registerServiceWorker'

/** Registers the PWA service worker once on mount. See `registerServiceWorker`. */
export const useRegisterServiceWorker = (): void => {
  useEffect(() => {
    registerServiceWorker()
  }, [])
}
