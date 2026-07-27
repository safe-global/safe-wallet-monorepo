import { normalizeError } from '@safe-global/utils/services/exceptions/normalizeError'
import type { ErrorContext, SurfacedError } from '../../types'
import { MixpanelEvent, MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { mixpanelTrack } from '@/services/analytics/mixpanel'

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
    ...(context.rpcEndpointKind && { [MixpanelEventParams.RPC_ENDPOINT_KIND]: context.rpcEndpointKind }),
    ...(context.rpcHost && { [MixpanelEventParams.RPC_HOST]: context.rpcHost }),
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
export const trackErrorSurfaced = ({ code, message, isUserFacing, context }: SurfacedError): void => {
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
