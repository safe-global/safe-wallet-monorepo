import useLocalStorage from '@/services/local-storage/useLocalStorage'

export const TWO_FACTOR_AWARENESS_DISMISSED_KEY = 'twoFactorAwarenessDismissed'

export function useTwoFactorAwarenessDismissed(): [boolean, () => void] {
  const [isDismissed = false, setIsDismissed] = useLocalStorage<boolean>(TWO_FACTOR_AWARENESS_DISMISSED_KEY)

  return [isDismissed, () => setIsDismissed(true)]
}
