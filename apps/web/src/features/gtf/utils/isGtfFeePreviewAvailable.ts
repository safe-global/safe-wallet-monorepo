import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getGasPaymentOptions } from '@safe-global/utils/utils/gasPaymentOptions'

/**
 * Whether the CGW can quote Safe-pays fees on this chain. `/fees/{safe}/preview` and the relay of a
 * refunding transaction both require `PAY_FROM_SAFE` in the chain's `relayer.gasPaymentOptions`
 * (`FeesService.getFeePreview`, `RelayManager.getRefundingRelayer`), so the web keys on the same
 * option: a chain can carry the GTF feature flag while previews are impossible — the fee section
 * then renders as signer-pays and the preview endpoint is never called.
 */
export const isGtfFeePreviewAvailable = (chain: Chain | undefined): chain is Chain =>
  !!chain && getGasPaymentOptions(chain).includes('PAY_FROM_SAFE')
