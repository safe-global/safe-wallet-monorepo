import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getGasPaymentOptions } from '@safe-global/utils/utils/gasPaymentOptions'

/** The CGW quotes and relays Safe-pays txs only where the relayer lists `PAY_FROM_SAFE`. */
export const isPayFromSafeAvailable = (chain: Chain | undefined): chain is Chain =>
  !!chain && getGasPaymentOptions(chain).includes('PAY_FROM_SAFE')
