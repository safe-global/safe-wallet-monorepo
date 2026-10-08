import type { ReactElement } from 'react'
import classNames from 'classnames'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { TX_LIST_ITEM_VALUE } from './TxListAccordionItem'
import css from './styles.module.css'

export type TransactionSkeletonViewProps = Record<string, never>

export const TransactionSkeletonView = (): ReactElement => (
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
