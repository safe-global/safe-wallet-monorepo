import type { ReactNode } from 'react'
import classNames from 'classnames'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import css from './styles.module.css'

export const TX_LIST_ITEM_VALUE = 'item'

type TxListAccordionItemProps = {
  summary: ReactNode
  details: ReactNode
  isNested?: boolean
  isBulkGroup?: boolean
  isBatched?: boolean
  keepMounted?: boolean
  testId?: string
  value?: Array<string>
  defaultValue?: Array<string>
  onValueChange?: (value: Array<string>) => void
}

// The card shell every transaction list row shares: summary row as trigger, details as full-bleed panel
const TxListAccordionItem = ({
  summary,
  details,
  isNested = false,
  isBulkGroup = false,
  isBatched = false,
  keepMounted,
  testId,
  value,
  defaultValue,
  onValueChange,
}: TxListAccordionItemProps) => {
  return (
    <Accordion value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
      <AccordionItem
        value={TX_LIST_ITEM_VALUE}
        className={classNames(css.listItem, {
          [css.listItemNested]: isNested,
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
          {summary}
        </AccordionTrigger>

        <AccordionContent
          data-testid="accordion-details"
          keepMounted={keepMounted}
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
          {details}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default TxListAccordionItem
