import type {
  AttestationVerificationStatus,
  NormalizedCheckEvent,
  PublicCheckStatus,
  UnavailableReason,
} from '@safe-global/utils/features/safenet-checks'
import { checkKey, type CheckIdentity } from '@safe-global/store/safenet/safenetCheckSlice'
import { MixpanelEventParams, SafenetCheckResult } from '@/services/analytics/mixpanel-events'
import { SAFENET_EVENTS } from '@/services/analytics/events/safenet'
import type { SafenetCheckLocation, SafenetSignerRole } from '@/services/analytics/mixpanel-events'
import { trackEvent } from '@/services/analytics'
import { toSafenetCheckResult, toSafenetUnavailableReason } from './safenetCheckResult'
import { summariseRejection } from './summariseRejection'

const trackedResults = new Set<string>()

type CheckedInput = {
  identity: CheckIdentity
  publicStatus: PublicCheckStatus
  unavailableReason?: UnavailableReason
  attestationStatus?: AttestationVerificationStatus
  events: ReadonlyArray<NormalizedCheckEvent>
  signerRole: SafenetSignerRole | undefined
  location: SafenetCheckLocation
}

export const trackSafenetChecked = ({
  identity,
  publicStatus,
  unavailableReason,
  attestationStatus,
  events,
  signerRole,
  location,
}: CheckedInput): void => {
  const result = toSafenetCheckResult(publicStatus, unavailableReason, events)
  if (!result) return

  const trackedKey = `${checkKey(identity)}:${result}:${signerRole ?? 'none'}`
  if (trackedResults.has(trackedKey)) return
  trackedResults.add(trackedKey)

  const { rules, flagged, revealed } = summariseRejection(events)
  const failureReason =
    result === SafenetCheckResult.UNAVAILABLE
      ? toSafenetUnavailableReason(publicStatus, unavailableReason, attestationStatus)
      : undefined
  trackEvent(SAFENET_EVENTS.CHECKED, {
    [MixpanelEventParams.SAFE_TX_HASH]: identity.safeTxHash,
    [MixpanelEventParams.RESULT]: result,
    [MixpanelEventParams.RULES_FLAGGED]: result === SafenetCheckResult.NO_ISSUES ? [] : rules.map(({ id }) => id),
    [MixpanelEventParams.SENTINELS_FLAGGED]: `${flagged} of ${revealed}`,
    [MixpanelEventParams.LOCATION]: location,
    ...(signerRole && { [MixpanelEventParams.SIGNER_ROLE]: signerRole }),
    ...(failureReason && { [MixpanelEventParams.FAILURE_REASON]: failureReason }),
  })
}
