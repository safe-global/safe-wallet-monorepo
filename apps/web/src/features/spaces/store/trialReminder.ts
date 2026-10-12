import type { listenerMiddlewareInstance } from '@/store/index'
import { setUnauthenticated } from '@/store/authSlice'
import { sessionItem } from '@/services/local-storage/session'

/** The Workspaces whose trial-ending reminder was dismissed in this session; a sign-out starts over. */
const seenReminders = sessionItem<Record<string, true>>('safeProTrialReminderSeen')

export const wasTrialReminderSeen = (spaceId: string): boolean => Boolean(seenReminders.get()?.[spaceId])

export const markTrialReminderSeen = (spaceId: string) =>
  seenReminders.set({ ...(seenReminders.get() ?? {}), [spaceId]: true })

export const _clearTrialReminders = () => seenReminders.remove()

/** Each login gets the reminder once: signing out forgets the dismissals. */
export const trialReminderListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    actionCreator: setUnauthenticated,
    effect: () => _clearTrialReminders(),
  })
}
