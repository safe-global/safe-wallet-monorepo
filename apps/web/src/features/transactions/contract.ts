import type PendingTxList from './components/PendingTxList'

export interface TransactionsContract {
  PendingTxList: typeof PendingTxList
}
