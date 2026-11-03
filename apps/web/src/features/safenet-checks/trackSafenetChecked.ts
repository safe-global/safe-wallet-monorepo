import type { NormalizedCheckEvent } from '@safe-global/utils/features/safenet-checks/types/events'
import type { PublicCheckStatus, UnavailableReason } from '@safe-global/utils/features/safenet-checks/types/status'
import { checkKey, type CheckIdentity } from '@safe-global/store/safenet/safenetCheckSlice'
import { trackEvent } from '@/services/analytics'
import { MixpanelEventParams, SafenetCheckResult, type SafenetSignerRole } from '@/services/analytics/mixpanel-events'
import { SAFENET_EVENTS } from '@/services/analytics/events/safenet'
import { toSafenetCheckResult } from './safenetCheckResult'
import { summariseRejection } from './summariseRejection'

const trackedResults = new Set<string>()

type CheckedInput = {
  identity: CheckIdentity
  publicStatus: PublicCheckStatus
  unavailableReason?: UnavailableReason
  events: ReadonlyArray<NormalizedCheckEvent>
  signerRole: SafenetSignerRole | undefined
}

export const trackSafenetChecked = ({
  identity,
  publicStatus,
  unavailableReason,
  events,
  signerRole,
}: CheckedInput): void => {
  const result = toSafenetCheckResult(publicStatus, unavailableReason, events)
  if (!result) return

  const trackedKey = `${checkKey(identity)}:${result}:${signerRole ?? 'none'}`
  if (trackedResults.has(trackedKey)) return
  trackedResults.add(trackedKey)

  const { rules, flagged, revealed } = summariseRejection(events)
  trackEvent(SAFENET_EVENTS.CHECKED, {
    [MixpanelEventParams.SAFE_TX_HASH]: identity.safeTxHash,
    [MixpanelEventParams.RESULT]: result,
    [MixpanelEventParams.RULES_FLAGGED]: result === SafenetCheckResult.NO_ISSUES ? [] : rules.map(({ id }) => id),
    [MixpanelEventParams.SENTINELS_FLAGGED]: `${flagged} of ${revealed}`,
    ...(signerRole && { [MixpanelEventParams.SIGNER_ROLE]: signerRole }),
  })
}
