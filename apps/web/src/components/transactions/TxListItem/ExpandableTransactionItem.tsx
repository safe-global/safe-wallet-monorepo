import type { MultisigTransaction, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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

  // Mount the details on first expand, then keep them mounted. A constant `keepMounted` would
  // instead mount every row's TxDetails upfront — one details request per list row.
  const [hasExpanded, setHasExpanded] = useState(!!txDetails)

  return (
    <Accordion
      defaultValue={txDetails ? [ITEM_VALUE] : []}
      onValueChange={(value) => {
        if (value.includes(ITEM_VALUE)) {
          setHasExpanded(true)
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
          // `@container` so TxSummary's row can size itself against the width it actually has rather
          // than the viewport's. With the sidebar expanded a 920px viewport leaves the row only 638px,
          // so viewport-based breakpoints kept the one-line grid past the point it fitted and
          // `overflow-x-auto` turned that into a scrollbar.
          className={classNames(
            // rounded-none: the shadcn trigger's own rounded-md would curve its fill inside the row's
            // square edges. The row owns the corners — only a group's first and last get any.
            '@container cursor-pointer items-center justify-start overflow-x-auto rounded-none py-3',
            // A bulk group's card already insets its row block by 12px, so the row halves its own
            // padding to land the nonce 24px in — level with a standalone row's nonce.
            isBulkGroup ? 'px-3' : 'px-4 sm:px-6',
          )}
        >
          <TxSummary item={item} isConflictGroup={isConflictGroup} isBulkGroup={isBulkGroup} />
        </AccordionTrigger>

        <AccordionContent
          data-testid="accordion-details"
          keepMounted={hasExpanded}
          // Full-bleed panel: the details draw their separators — and the vertical rule beside the
          // audit log — as borders on their own blocks, so any padding here holds those rules off
          // the card's edges. The inset moves onto each block via `--tx-details-edge-inset` (see
          // TxDetails/styles.module.css), matching the trigger's horizontal padding above so text
          // lands exactly where it did. `pb-0` for the same reason: the blocks bring their own
          // bottom padding, and padding here would cut the vertical rule short of the card's edge.
          className={classNames(
            'pt-0 pb-0',
            // Mirrors the trigger's horizontal padding above so the details' text lands on the same
            // vertical line while their borders still span the card. `--spacing(3)` is what `px-3`
            // resolves to, so the two cannot drift if the spacing scale moves.
            isBulkGroup
              ? '[--tx-details-edge-inset:--spacing(3)]'
              : '[--tx-details-edge-inset:var(--space-2)] sm:[--tx-details-edge-inset:var(--space-3)]',
            css.accordionContentSurface,
          )}
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
