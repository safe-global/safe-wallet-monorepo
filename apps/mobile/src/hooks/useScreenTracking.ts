import { useEffect } from 'react'
import { usePathname, useGlobalSearchParams } from 'expo-router'
import { getAnalytics } from '@react-native-firebase/analytics'

export const useScreenTracking = () => {
  const pathname = usePathname()
  const params = useGlobalSearchParams()

  useEffect(() => {
    const logScreenView = async () => {
      await getAnalytics().logScreenView({
        screen_name: pathname,
        screen_class: pathname,
      })
    }
    logScreenView()
  }, [pathname, params])
}
