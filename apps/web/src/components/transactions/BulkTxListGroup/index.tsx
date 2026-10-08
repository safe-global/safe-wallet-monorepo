import type { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import type { AnyTransactionItem } from '@/utils/tx-list'
import type { ReactElement } from 'react'
import { isSwapTransferOrderTxInfo } from '@/utils/transaction-guards'
import ExpandableTransactionItem from '@/components/transactions/TxListItem/ExpandableTransactionItem'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import { getOrderClass } from '@/features/swap'
import { BulkTxListGroupView } from '@views/components/transactions/BulkTxListGroup/BulkTxListGroupView'

const GroupedTxListItems = ({
  groupedListItems,
  transactionHash,
}: {
  groupedListItems: AnyTransactionItem[]
  transactionHash: string
}): ReactElement | null => {
  const chain = useCurrentChain()
  const explorerLink = chain && getBlockExplorerLink(chain, transactionHash)?.href
  if (groupedListItems.length === 0) return null
  const isSwapTransfer = isSwapTransferOrderTxInfo(groupedListItems[0].transaction.txInfo)
  const orderClass = isSwapTransfer
    ? getOrderClass(groupedListItems[0].transaction.txInfo as OrderTransactionInfo)
    : undefined
  return (
    <BulkTxListGroupView
      orderClass={orderClass}
      explorerLink={explorerLink}
      items={groupedListItems.map((tx) => ({
        id: tx.transaction.id,
        item: <ExpandableTransactionItem item={tx} isBulkGroup={true} />,
      }))}
    />
  )
}

export default GroupedTxListItems
