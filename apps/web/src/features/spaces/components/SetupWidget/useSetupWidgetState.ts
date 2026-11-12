import { useEffect } from 'react'
import { addDays } from 'date-fns'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

export const DISMISS_STORAGE_KEY = 'setupWidgetDismissed'
export const COMPLETED_STORAGE_KEY = 'setupWidgetCompleted'
export const DISMISS_COUNT_STORAGE_KEY = 'setupWidgetDismissCount'
export const DISMISS_DAYS = 3
export const MAX_DISMISSALS = 3

const useSetupWidgetState = (spaceId: string | null | undefined) => {
  const [dismissedSpaces = {}, setDismissedSpaces] = useLocalStorage<Record<string, number>>(DISMISS_STORAGE_KEY)
  const [completedSpaces = {}, setCompletedSpaces] = useLocalStorage<Record<string, boolean>>(COMPLETED_STORAGE_KEY)
  const [dismissCounts = {}, setDismissCounts] = useLocalStorage<Record<string, number>>(DISMISS_COUNT_STORAGE_KEY)

  useEffect(() => {
    const now = Date.now()
    const expired = Object.keys(dismissedSpaces).filter((key) => dismissedSpaces[key] <= now)
    if (expired.length === 0) return

    setDismissedSpaces((prev = {}) => {
      const updated = { ...prev }
      expired.forEach((key) => delete updated[key])
      return updated
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isDismissed = spaceId ? (dismissedSpaces[spaceId] ?? 0) > Date.now() : false
  const isCompleted = spaceId ? completedSpaces[spaceId] === true : false

  const markCompleted = () => {
    if (!spaceId) return
    setCompletedSpaces((prev = {}) => ({ ...prev, [spaceId]: true }))
  }

  const dismiss = () => {
    if (!spaceId) return
    setDismissedSpaces((prev = {}) => ({ ...prev, [spaceId]: addDays(new Date(), DISMISS_DAYS).getTime() }))
    const count = (dismissCounts[spaceId] ?? 0) + 1
    setDismissCounts((prev = {}) => ({ ...prev, [spaceId]: count }))
    if (count >= MAX_DISMISSALS) markCompleted()
  }

  return { isHidden: isDismissed || isCompleted, dismiss, markCompleted }
}

export default useSetupWidgetState
