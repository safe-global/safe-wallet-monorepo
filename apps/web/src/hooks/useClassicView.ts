import { useSyncExternalStore } from 'react'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useChain } from '@/hooks/useChains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import { sessionItem } from '@/services/local-storage/session'

// The session flag persists the "I want the old UI" opt-in across reloads within
// a single tab. Closing the tab (or opening the app in a fresh tab) goes back to
// the gated experience, which is intentional — classic view is an escape hatch,
// not a permanent setting.
const CLASSIC_VIEW_SESSION_KEY = 'classicViewEnabled'

const classicViewSession = sessionItem<boolean>(CLASSIC_VIEW_SESSION_KEY)

const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const notify = () => {
  for (const listener of listeners) listener()
}

const getSnapshot = (): boolean => classicViewSession.get() === true

const getServerSnapshot = (): boolean => false

export const enableClassicView = (): void => {
  classicViewSession.set(true)
  notify()
}

export const disableClassicView = (): void => {
  classicViewSession.remove()
  notify()
}

/**
 * Whether the "classic view" escape hatch is exposed by the backend.
 *
 * The chains config flag is CLASSIC_VIEW (default OFF = escape hatch hidden).
 * When the flag is explicitly set the classic view escape hatch is exposed.
 *
 * Returns `undefined` while the chains config is still loading so callers can
 * avoid flashing UI before the answer is known.
 */
export const useIsClassicViewFeatureEnabled = (): boolean | undefined => {
  const chain = useChain(String(DEFAULT_CHAIN_ID))
  if (!chain) return undefined
  return hasFeature(chain, FEATURES.CLASSIC_VIEW)
}

/**
 * Whether the user has opted into classic view in this tab.
 *
 * Subscribes to session-storage changes via in-memory listeners so the banner
 * and the require-login gate update together when the opt-in is toggled.
 */
export const useIsClassicViewOptedIn = (): boolean => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Whether classic view is currently active: the feature is exposed AND the user
 * has opted in this session.
 *
 * Note: when the chains config is still loading this returns `false` rather
 * than `undefined` because the opt-in is the strict gate — a user with no
 * opt-in is never in classic view, regardless of the flag's state.
 */
export const useIsClassicViewActive = (): boolean => {
  const isFeatureEnabled = useIsClassicViewFeatureEnabled()
  const isOptedIn = useIsClassicViewOptedIn()
  return isFeatureEnabled === true && isOptedIn
}
