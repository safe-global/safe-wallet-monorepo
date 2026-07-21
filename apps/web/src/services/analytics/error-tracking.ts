import { normalizeError } from '@safe-global/utils/services/exceptions/normalizeError'
import type { ErrorContext } from '@/services/exceptions'
import { MixpanelEvent, MixpanelEventParams } from './mixpanel-events'
import { mixpanelTrack } from './mixpanel'

export interface ErrorSurfacedInput {
  /** Numeric part of the coded error (`CodedException.code`). */
  code: number
  /** Full error message; used only for classification — never sent to Mixpanel. */
  message: string
  /** Whether the error was shown to the user (true for `trackError`, false for `logError`). */
  isUserFacing: boolean
  /** Optional call-site context (e.g. txHash), mapped to Mixpanel properties below. */
  context?: ErrorContext
}

/**
 * Maps the analytics-agnostic `ErrorContext` to Mixpanel event properties.
 * Only present keys are emitted, so events stay compact and free of `undefined`.
 */
const mapContext = (context?: ErrorContext): Record<string, string> => {
  if (!context) return {}
  return {
    ...(context.txHash && { [MixpanelEventParams.TX_HASH]: context.txHash }),
    ...(context.targetContractLabel && { [MixpanelEventParams.TARGET_CONTRACT_LABEL]: context.targetContractLabel }),
    ...(context.transactionType && { [MixpanelEventParams.TRANSACTION_TYPE]: context.transactionType }),
  }
}

/**
 * Emits the single `Error Surfaced` analytics event (WA-2775).
 *
 * Sends enums (+ whitelisted context like txHash) only — the raw/sanitized
 * message stays out of Mixpanel so no wallet, address or calldata can leak into
 * analytics (AC7). Reused properties (Blockchain Network, Safe Address, EOA
 * Wallet Label) are attached automatically as Mixpanel super-properties.
 */
export const trackErrorSurfaced = ({ code, message, isUserFacing, context }: ErrorSurfacedInput): void => {
  const normalized = normalizeError({ code, message, isUserFacing })

  mixpanelTrack(MixpanelEvent.ERROR_SURFACED, {
    [MixpanelEventParams.ERROR_DOMAIN]: normalized.domain,
    [MixpanelEventParams.ERROR_TYPE]: normalized.type,
    [MixpanelEventParams.ERROR_LAYER]: normalized.layer,
    [MixpanelEventParams.ERROR_CODE]: normalized.code,
    [MixpanelEventParams.IS_USER_FACING]: normalized.isUserFacing,
    ...mapContext(context),
  })
}
