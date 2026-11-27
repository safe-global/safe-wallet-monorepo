import { useEffect, useEffectEvent, useId, useSyncExternalStore } from 'react'
import type { OverlayKind } from './kinds'
import { acknowledge, clearDue, getShown, setDue, subscribe } from './store'

type OverlayOptions = {
  kind: OverlayKind
  /** The overlay's own conditions say it should show now. */
  isDue: boolean
  /** Runs each time the overlay gets the screen; write "seen" flags here, not when the overlay becomes due. */
  onShown?: () => void
}

/**
 * Queues an overlay that opens without a click, so that only one shows at a time. Render the overlay only while
 * this returns true; make `isDue` false to close it and let the next one show.
 *
 * The kind orders overlays that are due together. One that is already shown keeps the screen, so an overlay that
 * must come before another that mounts earlier says so in that overlay's own condition.
 */
export const useOverlay = ({ kind, isDue, onShown }: OverlayOptions): boolean => {
  const key = useId()
  const shown = useSyncExternalStore(subscribe, getShown, () => null)
  const isShown = isDue && shown === key
  const reportShown = useEffectEvent(() => onShown?.())

  useEffect(() => {
    if (!isDue) return
    setDue(key, kind)
    return () => clearDue(key)
  }, [key, kind, isDue])

  useEffect(() => {
    if (isShown && acknowledge(key)) reportShown()
  }, [key, isShown])

  return isShown
}
