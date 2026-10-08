import type { MultisigTransaction, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import TxListAccordionItem, { TX_LIST_ITEM_VALUE } from '@views/components/transactions/TxListItem/TxListAccordionItem'
import { TransactionSkeletonView } from '@views/components/transactions/TxListItem/TransactionSkeletonView'
import TxSummary from '@/components/transactions/TxSummary'
import TxDetails from '@/components/transactions/TxDetails'
import CreateTxInfo from '@/components/transactions/SafeCreationTx'
import { isCreationTxInfo } from '@/utils/transaction-guards'
import { useContext, useState } from 'react'
import { BatchExecuteHoverContext } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import { trackEvent, TX_LIST_EVENTS } from '@/services/analytics'

type ExpandableTransactionItemProps = {
  isConflictGroup?: boolean
  isBulkGroup?: boolean
  item: MultisigTransaction
  txDetails?: TransactionDetails
}

const ExpandableTransactionItem = ({
  isConflictGroup = false,
  isBulkGroup = false,
  item,
  txDetails,
  testId,
}: ExpandableTransactionItemProps & { testId?: string }) => {
  const hoverContext = useContext(BatchExecuteHoverContext)

  const isBatched = hoverContext.activeHover.includes(item.transaction.id)

  // Mount the details on first expand, then keep them mounted. A constant `keepMounted` would
  // instead mount every row's TxDetails upfront — one details request per list row.
  const [hasExpanded, setHasExpanded] = useState(!!txDetails)

  return (
    <TxListAccordionItem
      defaultValue={txDetails ? [TX_LIST_ITEM_VALUE] : []}
      onValueChange={(value) => {
        if (value.includes(TX_LIST_ITEM_VALUE)) {
          setHasExpanded(true)
          trackEvent(TX_LIST_EVENTS.EXPAND_TRANSACTION)
        }
      }}
      isNested={isBulkGroup || isConflictGroup}
      isBulkGroup={isBulkGroup}
      isBatched={isBatched}
      keepMounted={hasExpanded}
      testId={testId}
      summary={<TxSummary item={item} isConflictGroup={isConflictGroup} isBulkGroup={isBulkGroup} />}
      details={
        isCreationTxInfo(item.transaction.txInfo) ? (
          <CreateTxInfo txSummary={item.transaction} />
        ) : (
          <TxDetails txSummary={item.transaction} txDetails={txDetails} contrastSurface />
        )
      }
    />
  )
}

export const TransactionSkeleton = () => <TransactionSkeletonView />

export default ExpandableTransactionItem
