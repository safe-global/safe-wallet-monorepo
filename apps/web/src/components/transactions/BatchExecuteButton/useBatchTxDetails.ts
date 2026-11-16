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
  if (isError) return 'error'
  return details ? 'ready' : 'loading'
}

/** Loads the details of a batch, which tell whether its transactions pay gas from the Safe. */
const useBatchTxDetails = (txs: ModuleTransaction[], { skip }: { skip: boolean }) => {
  const chainId = useChainId()
  const { currentData, isError, refetch } = useTransactionsGetMultipleTransactionDetailsQuery(
    { chainId, txIds: txs.map((tx) => tx.transaction.id) },
    { skip: skip || !chainId },
  )

  const safePaidCount = useMemo(() => currentData?.filter(paysGasFromSafe).length ?? 0, [currentData])

  return { status: toStatus(currentData, isError), safePaidCount, retry: refetch }
}

export default useBatchTxDetails
