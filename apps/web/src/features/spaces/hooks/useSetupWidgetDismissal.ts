import { useCallback, useEffect } from 'react'
import { addDays } from 'date-fns'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

const DISMISS_STORAGE_KEY = 'setupWidgetDismissed'
export const DISMISS_COUNT_STORAGE_KEY = 'setupWidgetDismissCount'
export const COMPLETED_STORAGE_KEY = 'setupWidgetCompleted'
const DISMISS_DAYS = 3
const MAX_DISMISSALS = 3

export const useSetupWidgetDismissal = (spaceId: string | null | undefined) => {
  const [dismissedSpaces = {}, setDismissedSpaces] = useLocalStorage<Record<string, number>>(DISMISS_STORAGE_KEY)
  const [dismissCounts = {}, setDismissCounts] = useLocalStorage<Record<string, number>>(DISMISS_COUNT_STORAGE_KEY)
  const [completedSpaces = {}] = useLocalStorage<Record<string, boolean>>(COMPLETED_STORAGE_KEY)

  useEffect(() => {
    const now = Date.now()
    const expired = Object.entries(dismissedSpaces).filter(([, expiry]) => expiry <= now)

    if (expired.length > 0) {
      setDismissedSpaces((prev = {}) => {
        const updated = { ...prev }
        expired.forEach(([key]) => delete updated[key])
        return updated
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isTemporarilyDismissed = spaceId ? (dismissedSpaces[spaceId] ?? 0) > Date.now() : false
  const isPermanentlyDismissed = spaceId ? (dismissCounts[spaceId] ?? 0) >= MAX_DISMISSALS : false
  const isMarkedCompleted = spaceId ? completedSpaces[spaceId] === true : false

  const dismiss = useCallback(() => {
    if (!spaceId) return

    setDismissedSpaces((prev = {}) => ({
      ...prev,
      [spaceId]: addDays(new Date(), DISMISS_DAYS).getTime(),
    }))
    setDismissCounts((prev = {}) => ({
      ...prev,
      [spaceId]: (prev[spaceId] ?? 0) + 1,
    }))
  }, [spaceId, setDismissedSpaces, setDismissCounts])

  return { isHidden: isTemporarilyDismissed || isPermanentlyDismissed || isMarkedCompleted, dismiss }
}
