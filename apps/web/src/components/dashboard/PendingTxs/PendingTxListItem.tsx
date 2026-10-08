import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import TxInfo from '@/components/transactions/TxInfo'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import { AppRoutes } from '@/config/routes'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import { useUrlSpaceId, withSpaceId } from '@/hooks/useUrlSpaceId'
import { PendingTxListItemView } from '@views/components/dashboard/PendingTxs/PendingTxListItemView'

type PendingTxType = {
  transaction: Transaction
}

const PendingTx = ({ transaction }: PendingTxType): ReactElement => {
  const { id } = transaction
  const safeQueryParam = useSafeQueryParam()
  const spaceId = useUrlSpaceId()

  const url = useMemo(
    () => ({
      pathname: AppRoutes.transactions.tx,
      query: withSpaceId({ id, safe: safeQueryParam }, spaceId),
    }),
    [safeQueryParam, spaceId, id],
  )

  return (
    <PendingTxListItemView
      url={url}
      timestamp={transaction.timestamp}
      txTypeIcon={<TxTypeIcon tx={transaction} />}
      txTypeText={<TxTypeText tx={transaction} />}
      txInfo={<TxInfo info={transaction.txInfo} />}
      confirmations={
        isMultisigExecutionInfo(transaction.executionInfo)
          ? {
              submitted: transaction.executionInfo.confirmationsSubmitted,
              required: transaction.executionInfo.confirmationsRequired,
            }
          : undefined
      }
    />
  )
}

export default PendingTx
