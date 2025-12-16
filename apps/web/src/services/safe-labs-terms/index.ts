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
