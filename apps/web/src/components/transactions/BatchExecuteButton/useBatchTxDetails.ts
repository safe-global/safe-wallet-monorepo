import { useMemo } from 'react'
import type { ModuleTransaction, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTransactionsGetMultipleTransactionDetailsQuery } from '@safe-global/store/gateway/transactions'
import { isPaidFromSafe } from '@safe-global/utils/utils/isPaidFromSafe'
import useChainId from '@/hooks/useChainId'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'

export type BatchTxDetailsStatus = 'loading' | 'error' | 'ready'

const paysGasFromSafe = ({ detailedExecutionInfo }: TransactionDetails): boolean =>
  isMultisigDetailedExecutionInfo(detailedExecutionInfo) &&
  isPaidFromSafe({
    gasPrice: detailedExecutionInfo.gasPrice,
    baseGas: detailedExecutionInfo.baseGas,
    refundReceiver: detailedExecutionInfo.refundReceiver?.value,
  })

const toStatus = (details: TransactionDetails[] | undefined, isError: boolean): BatchTxDetailsStatus => {
  if (details) return 'ready'
  return isError ? 'error' : 'loading'
}

/** Loads the details of a batch, which tell whether its transactions pay gas from the Safe. */
const useBatchTxDetails = (txs: ModuleTransaction[], { skip }: { skip: boolean }) => {
  const chainId = useChainId()
  const { data, isError, refetch } = useTransactionsGetMultipleTransactionDetailsQuery(
    { chainId, txIds: txs.map((tx) => tx.transaction.id) },
    { skip: skip || !chainId },
  )

  const safePaidCount = useMemo(() => data?.filter(paysGasFromSafe).length ?? 0, [data])

  return { status: toStatus(data, isError), safePaidCount, retry: refetch }
}

export default useBatchTxDetails
