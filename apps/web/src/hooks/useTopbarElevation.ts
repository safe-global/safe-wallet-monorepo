import { useEffect, useSyncExternalStore } from 'react'

// Allowlist of modals that must elevate the topbar above their backdrop while open.
// Add a new id here before calling `useTopbarElevation` from a new modal.
const ELEVATED_MODAL_IDS = ['recovery', 'tx-flow'] as const

export type ElevatedModalId = (typeof ELEVATED_MODAL_IDS)[number]

// Popups whose backdrop lives in the shadcn overlay layer (--z-overlay) rather than the low-z
// modal layer above. While one is open the topbar is raised one step above that backdrop so it
// stays lit while the rest of the page dims.
const OVERLAY_POPUP_IDS = ['safe-selector'] as const

export type OverlayPopupId = (typeof OVERLAY_POPUP_IDS)[number]

/**
 * Builds an elevate-while-open hook pair sharing a module-level store:
 * - the first hook registers `id` while `isOpen` is true (auto-resets on close/unmount)
 * - the second returns whether any id is currently registered
 */
const createElevationHooks = <Id extends string>() => {
  const openPopups = new Set<Id>()
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

  const useElevation = (id: Id, isOpen: boolean): void => {
    useEffect(() => {
      if (!isOpen) return
      openPopups.add(id)
      notify()
      return () => {
        openPopups.delete(id)
        notify()
      }
    }, [id, isOpen])
  }

  const useIsElevated = (): boolean => {
    return useSyncExternalStore(
      subscribe,
      () => openPopups.size > 0,
      () => false,
    )
  }

  return [useElevation, useIsElevated] as const
}

const [useModalElevation, useIsModalElevated] = createElevationHooks<ElevatedModalId>()
const [useOverlayElevation, useIsOverlayElevated] = createElevationHooks<OverlayPopupId>()

/**
 * Call from a modal component to elevate the topbar (higher z-index + fixed position)
 * while `isOpen` is true. Resets automatically on close or unmount.
 */
export const useTopbarElevation: (id: ElevatedModalId, isOpen: boolean) => void = useModalElevation

/**
 * Returns true while any modal from the allowlist is open. Used by the topbar
 * to raise its z-index and switch to position: fixed.
 */
export const useIsTopbarElevated: () => boolean = useIsModalElevated

/**
 * Call from a popup whose backdrop sits in the shadcn overlay layer (e.g. the safe-selector
 * dropdown) to lift the topbar above that backdrop while `isOpen` is true.
 */
export const useTopbarOverlayElevation: (id: OverlayPopupId, isOpen: boolean) => void = useOverlayElevation

/** Returns true while any overlay-layer popup is open. Used by the topbar. */
export const useIsTopbarAboveOverlay: () => boolean = useIsOverlayElevated
