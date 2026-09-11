import useLocalStorage from '@/services/local-storage/useLocalStorage'

export const SAFE_PRO_SIDEBAR_BANNER_DISMISSED_KEY = 'safeProSidebarBannerDismissed'

export function useSafeProSidebarBannerDismissed(): [boolean, () => void] {
  const [isDismissed = false, setIsDismissed] = useLocalStorage<boolean>(SAFE_PRO_SIDEBAR_BANNER_DISMISSED_KEY)

  return [isDismissed, () => setIsDismissed(true)]
}
