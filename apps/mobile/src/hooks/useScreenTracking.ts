import { useEffect } from 'react'
import { usePathname, useGlobalSearchParams } from 'expo-router'
import { trackScreenView } from '@/src/services/analytics'

export const useScreenTracking = () => {
  const pathname = usePathname()
  const params = useGlobalSearchParams()

  useEffect(() => {
    const logScreenView = async () => {
      await trackScreenView(pathname, pathname)
    }
    logScreenView()
  }, [pathname, params])
}
