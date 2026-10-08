import type { ReactElement } from 'react'
import TransactionDetailsError from './TransactionDetailsError'

export type SingleTxViewProps = {
  isForeignTx: boolean
  onReload?: () => void
}

export const SingleTxView = ({ isForeignTx, onReload }: SingleTxViewProps): ReactElement => {
  if (isForeignTx) {
    return <TransactionDetailsError message="This transaction was not found in this Safe account." />
  }

  return <TransactionDetailsError onReload={onReload} />
}
