import ExternalStore from '@safe-global/utils/services/ExternalStore'
import { useCurrentMembership } from '../public/hooks/useSpaceMembers'
import { wasTrialReminderSeen } from '../public/store/trialReminder'
import { useSpacePlan } from './useSpacePlan'

const isShowingStore = new ExternalStore<boolean>(false)

export const setTrialReminderShowing = (isShowing: boolean) => isShowingStore.setStore(isShowing)

export const useIsTrialReminderDue = (spaceId: string | null) => {
  const { isTrialEndingSoon, hasPaymentMethod } = useSpacePlan(spaceId)
  const membership = useCurrentMembership(spaceId ?? undefined)

  return Boolean(spaceId && isTrialEndingSoon && !hasPaymentMethod && membership && !wasTrialReminderSeen(spaceId))
}

/** True while the trial-ending reminder is loading, due or on screen, so other dialogs can wait for it. */
export const useIsTrialReminderPending = (spaceId: string | null) => {
  const { isLoading } = useSpacePlan(spaceId)
  const isDue = useIsTrialReminderDue(spaceId)
  const isShowing = isShowingStore.useStore() === true

  return isLoading || isDue || isShowing
}
