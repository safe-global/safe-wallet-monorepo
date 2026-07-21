import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { ReactElement } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'

import MsgDetails from '@/components/safe-messages/MsgDetails'
import MsgSummary from '@/components/safe-messages/MsgSummary'
// Reuse the shared transaction list-item card styling so signed messages match Queue items.
import css from '@/components/transactions/TxListItem/styles.module.css'

const ITEM_VALUE = 'message'

const ExpandableMsgItem = ({ msg, expanded = false }: { msg: MessageItem; expanded?: boolean }): ReactElement => {
  return (
    <Accordion defaultValue={expanded ? [ITEM_VALUE] : []}>
      <AccordionItem value={ITEM_VALUE} className={css.listItem}>
        <AccordionTrigger
          nativeButton={false}
          render={<div role="button" tabIndex={0} />}
          data-testid="message-item"
          className="cursor-pointer items-center justify-start overflow-x-auto px-4 py-3 hover:no-underline sm:px-6"
        >
          <MsgSummary msg={msg} />
        </AccordionTrigger>

        <AccordionContent className="p-0">
          <ObservabilityErrorBoundary fallback={<div className="p-4">Failed to render message details</div>}>
            <MsgDetails msg={msg} />
          </ObservabilityErrorBoundary>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default ExpandableMsgItem
