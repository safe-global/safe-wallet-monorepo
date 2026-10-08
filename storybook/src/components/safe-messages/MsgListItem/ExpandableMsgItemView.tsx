import type { ReactElement, ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
// Reuse the shared transaction list-item card styling so signed messages match Queue items.
import css from '@/components/transactions/TxListItem/styles.module.css'

const ITEM_VALUE = 'message'

export type ExpandableMsgItemViewProps = {
  expanded: boolean
  summary: ReactNode
  details: ReactNode
  renderErrorBoundary: (props: { fallback: ReactNode; children: ReactNode }) => ReactNode
}

export function ExpandableMsgItemView({
  expanded,
  summary,
  details,
  renderErrorBoundary,
}: ExpandableMsgItemViewProps): ReactElement {
  return (
    <Accordion defaultValue={expanded ? [ITEM_VALUE] : []}>
      <AccordionItem value={ITEM_VALUE} className={css.listItem}>
        <AccordionTrigger
          nativeButton={false}
          render={<div role="button" tabIndex={0} />}
          data-testid="message-item"
          className="cursor-pointer items-center justify-start overflow-x-auto px-4 py-3 sm:px-6"
        >
          {summary}
        </AccordionTrigger>

        <AccordionContent className="p-0">
          {renderErrorBoundary({
            fallback: <div className="p-4">Failed to render message details</div>,
            children: details,
          })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
