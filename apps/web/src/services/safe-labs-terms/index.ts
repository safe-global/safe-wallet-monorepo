import { localItem } from '@/services/local-storage/local'

export const SAFE_LABS_TERMS_KEY = 'safe-labs-terms'

const safeLabsTermsStorage = localItem<boolean>(SAFE_LABS_TERMS_KEY)

export const setSafeLabsTermsAccepted = () => {
  safeLabsTermsStorage.set(true)
}

export const getSafeLabsTermsAccepted = (): boolean | null => {
  return safeLabsTermsStorage.get()
}

export const hasAcceptedSafeLabsTerms = (): boolean => {
  return safeLabsTermsStorage.get() === true
}

/**
 * Clears all localStorage data.
 * This is used when a user declines to transfer their personal data.
 *
 * @returns {void}
 */
export const clearUserData = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.clear()
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}
