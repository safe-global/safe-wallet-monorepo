import ExternalStore from '@safe-global/utils/services/ExternalStore'

// Dismissal is held in memory only: the card is a short-lived notice, so closing it needs to last
// until the page is reloaded and no longer. Nothing is written to storage or to the backend.
export const twoFactorAwarenessDismissedStore = new ExternalStore<boolean>(false)

export function useTwoFactorAwarenessDismissed(): [boolean, () => void] {
  const isDismissed = twoFactorAwarenessDismissedStore.useStore() === true

  return [isDismissed, () => twoFactorAwarenessDismissedStore.setStore(true)]
}
