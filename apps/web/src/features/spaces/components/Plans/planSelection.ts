import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { MixpanelEventParams, PlanSelectionEntryPoint } from '@/services/analytics/mixpanel-events'

type Props = Record<string, unknown>

let pendingEntry: Props | undefined

/** For clicks that navigate to the Plans page: the page picks the entry props up when it renders. */
export const trackPlanSelectionStarted = (props: Props): void => {
  trackEvent(SAFE_PRO_EVENTS.PLAN_SELECTION_STARTED, props)
  pendingEntry = props
}

/** The entry that led here, consumed once; a Plans page opened without one was reached directly and starts the flow itself. */
export const takePlansEntry = (): Props => {
  const entry = pendingEntry
  pendingEntry = undefined
  if (entry) return entry
  const direct = { [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.DIRECT }
  trackEvent(SAFE_PRO_EVENTS.PLAN_SELECTION_STARTED, direct)
  return direct
}

export const _resetPlansEntry = (): void => {
  pendingEntry = undefined
}
