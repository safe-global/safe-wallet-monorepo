import type { MultisigTransaction, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import TxListAccordionItem, { TX_LIST_ITEM_VALUE } from './TxListAccordionItem'
import { Skeleton } from '@/components/ui/skeleton'
import TxSummary from '@/components/transactions/TxSummary'
import TxDetails from '@/components/transactions/TxDetails'
import CreateTxInfo from '@/components/transactions/SafeCreationTx'
import { isCreationTxInfo } from '@/utils/transaction-guards'
import { useContext, useState } from 'react'
import { BatchExecuteHoverContext } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import css from './styles.module.css'
import classNames from 'classnames'
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

export const TransactionSkeleton = () => (
  <>
    <Skeleton className="mt-5 mb-2 h-4 w-40 rounded-sm bg-[var(--color-background-skeleton)]" />

    <Accordion defaultValue={[TX_LIST_ITEM_VALUE]}>
      <AccordionItem value={TX_LIST_ITEM_VALUE} className={css.listItem}>
        <AccordionTrigger
          nativeButton={false}
          render={<div role="button" tabIndex={0} />}
          // `@container` so TxSummary's row can size itself against the width it actually has rather
          // than the viewport's. With the sidebar expanded a 920px viewport leaves the row only 638px,
          // so viewport-based breakpoints kept the one-line grid past the point it fitted and
          // `overflow-x-auto` turned that into a scrollbar.
          className="@container cursor-pointer items-center justify-start overflow-x-auto px-4 py-3 sm:px-6"
        >
          <Skeleton className="h-5 w-full rounded-none bg-[var(--color-background-skeleton)]" />
        </AccordionTrigger>

        <AccordionContent className={classNames('px-4 pb-4 pt-0 sm:px-6', css.accordionContentSurface)}>
          <Skeleton className="h-[325px] w-full rounded-md bg-[var(--color-background-skeleton)]" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </>
)

export default ExpandableTransactionItem
