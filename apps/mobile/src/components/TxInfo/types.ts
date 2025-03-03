import { Transaction, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxType } from '@/src/hooks/useTransactionType'

export type TxCardPress = { tx: Transaction; type: TxType }

export type TxConflictCardPress = { transactions: TransactionQueuedItem[] }
