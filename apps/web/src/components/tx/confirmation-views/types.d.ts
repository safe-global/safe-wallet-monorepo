import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'

export type NarrowConfirmationViewProps = {
  txInfo: TransactionDetails['txInfo']
  txData?: TransactionDetails['txData']
}
