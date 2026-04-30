import { useEffect, useSyncExternalStore } from 'react'

// Allowlist of modals that must elevate the topbar above their backdrop while open.
// Add a new id here before calling `useTopbarElevation` from a new modal.
const ELEVATED_MODAL_IDS = ['recovery', 'tx-flow'] as const

export type ElevatedModalId = (typeof ELEVATED_MODAL_IDS)[number]

const openModals = new Set<ElevatedModalId>()
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

const getSnapshot = () => openModals.size > 0

const getServerSnapshot = () => false

/**
 * Call from a modal component to elevate the topbar (higher z-index + fixed position)
 * while `isOpen` is true. Resets automatically on close or unmount.
 */
export const useTopbarElevation = (id: ElevatedModalId, isOpen: boolean): void => {
  useEffect(() => {
    if (!isOpen) return
    openModals.add(id)
    notify()
    return () => {
      openModals.delete(id)
      notify()
    }
  }, [id, isOpen])
}

/**
 * Returns true while any modal from the allowlist is open. Used by the topbar
 * to raise its z-index and switch to position: fixed.
 */
export const useIsTopbarElevated = (): boolean => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
