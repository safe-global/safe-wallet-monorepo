import type { MultisigTransaction, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import TxSummary from '@/components/transactions/TxSummary'
import TxDetails from '@/components/transactions/TxDetails'
import CreateTxInfo from '@/components/transactions/SafeCreationTx'
import { isCreationTxInfo } from '@/utils/transaction-guards'
import { useContext } from 'react'
import { BatchExecuteHoverContext } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import css from './styles.module.css'
import classNames from 'classnames'
import { trackEvent, TX_LIST_EVENTS } from '@/services/analytics'

const ITEM_VALUE = 'item'

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
  const isNestedListItem = isBulkGroup || isConflictGroup

  return (
    <Accordion
      defaultValue={txDetails ? [ITEM_VALUE] : []}
      onValueChange={(value) => {
        if (value.includes(ITEM_VALUE)) {
          trackEvent(TX_LIST_EVENTS.EXPAND_TRANSACTION)
        }
      }}
    >
      <AccordionItem
        value={ITEM_VALUE}
        className={classNames(css.listItem, {
          [css.listItemNested]: isNestedListItem,
          [css.batched]: isBatched,
        })}
        data-testid={testId}
      >
        <AccordionTrigger
          nativeButton={false}
          render={<div role="button" tabIndex={0} />}
          className="cursor-pointer items-center justify-start overflow-x-auto px-4 py-3 hover:no-underline sm:px-6"
        >
          <TxSummary item={item} isConflictGroup={isConflictGroup} isBulkGroup={isBulkGroup} />
        </AccordionTrigger>

        <AccordionContent
          data-testid="accordion-details"
          className={classNames('px-4 pb-4 pt-0 sm:px-6', css.accordionContentSurface)}
        >
          {isCreationTxInfo(item.transaction.txInfo) ? (
            <CreateTxInfo txSummary={item.transaction} />
          ) : (
            <TxDetails txSummary={item.transaction} txDetails={txDetails} contrastSurface />
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export const TransactionSkeleton = () => (
  <>
    <Skeleton className="mt-5 mb-2 h-4 w-40 rounded-sm bg-[var(--color-background-skeleton)]" />

    <Accordion defaultValue={[ITEM_VALUE]}>
      <AccordionItem value={ITEM_VALUE} className={css.listItem}>
        <AccordionTrigger
          nativeButton={false}
          render={<div role="button" tabIndex={0} />}
          className="cursor-pointer items-center justify-start overflow-x-auto px-4 py-3 hover:no-underline sm:px-6"
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
