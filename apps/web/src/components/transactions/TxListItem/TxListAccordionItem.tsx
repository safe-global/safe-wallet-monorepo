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
          // `@container`: the row sizes against its own width, not the viewport's, which the sidebar
          // makes much narrower than the breakpoints would suggest
          className={classNames(
            '@container cursor-pointer items-center justify-start overflow-x-auto rounded-none py-3',
            isBulkGroup ? 'px-3' : 'px-4 sm:px-6',
          )}
        >
          {summary}
        </AccordionTrigger>

        <AccordionContent
          data-testid="accordion-details"
          keepMounted={keepMounted}
          // Full-bleed: the details draw their own separators, so the inset moves onto each block via
          // `--tx-details-edge-inset` (mirroring the trigger's padding above) rather than living here
          className={classNames(
            'pt-0 pb-0',
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
