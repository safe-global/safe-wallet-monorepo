import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { BEAMER_ORIGIN, beamerApi } from '@/store/api/beamer'

const UPDATES_AVAILABLE = 'updatesAvailable'
// Our Beamer settings ("updatesDelay"): after a new post, each browser waits a random time up to this long before
// asking for it, so that not every open tab asks Beamer at the same moment.
export const MAX_UPDATE_DELAY = 10 * 60 * 1000
const MIN_UPDATE_DELAY = 100

// Beamer's updates page posts "updatesAvailable" or "updatesAvailable:" followed by a JSON object.
const parseUpdatesAvailable = (data: unknown): { isImmediate: boolean } | undefined => {
  if (typeof data !== 'string' || !data.startsWith(UPDATES_AVAILABLE)) return undefined
  const payload = data.slice(UPDATES_AVAILABLE.length + 1)
  if (!payload) return { isImmediate: false }

  let parsed: { immediate?: unknown } | null
  try {
    parsed = JSON.parse(payload)
  } catch {
    return undefined
  }
  return { isImmediate: parsed?.immediate === true }
}

export const useWhatsNewUpdateListener = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    let refetchTimeout: ReturnType<typeof setTimeout> | undefined
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== BEAMER_ORIGIN) return
      const update = parseUpdatesAvailable(event.data)
      if (!update) return

      const delay = update.isImmediate ? 0 : Math.max(MIN_UPDATE_DELAY, Math.ceil(Math.random() * MAX_UPDATE_DELAY))
      clearTimeout(refetchTimeout)
      refetchTimeout = setTimeout(() => dispatch(beamerApi.util.invalidateTags(['BeamerUpdates'])), delay)
    }
    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('message', onMessage)
      clearTimeout(refetchTimeout)
    }
  }, [dispatch])
}
