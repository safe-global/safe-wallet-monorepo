import { createContext, useContext } from 'react'
import type { SafeScope, SafeScopeContextValue, SafeScopeControls } from './types'

export const SafeScopeContext = createContext<SafeScopeContextValue | undefined>(undefined)

/**
 * The Safe a Space-level flow is operating on, or `undefined` on every Safe-level route.
 * Hooks that today read the URL/Redux Safe check this first and otherwise keep their original behaviour.
 */
export const useSafeScope = (): SafeScope | undefined => useContext(SafeScopeContext)?.scope

/** The provider itself, which a Space flow mounts before its first step picks a Safe. */
export const useSafeScopeContext = (): SafeScopeContextValue | undefined => useContext(SafeScopeContext)

export const useSafeScopeControls = (): SafeScopeControls => {
  const context = useContext(SafeScopeContext)
  if (!context) {
    throw new Error('useSafeScopeControls must be used within a SafeScopeProvider')
  }
  return { setScope: context.setScope, clearScope: context.clearScope }
}
