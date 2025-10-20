import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export type NarrowConfirmationViewProps = {
  txInfo: TransactionDetails['txInfo']
  txData?: TransactionDetails['txData']
}
