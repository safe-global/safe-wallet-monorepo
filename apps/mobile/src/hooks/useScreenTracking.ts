import { useEffect } from 'react'
import { usePathname, useGlobalSearchParams } from 'expo-router'
import { trackScreenView, trackDatadogView } from '@/src/services/analytics'

export const useScreenTracking = () => {
  const pathname = usePathname()
  const params = useGlobalSearchParams()

  useEffect(() => {
    trackDatadogView(pathname, pathname)
    trackScreenView(pathname, pathname)
  }, [pathname, params])
}
