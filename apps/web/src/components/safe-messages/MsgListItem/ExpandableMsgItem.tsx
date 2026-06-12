import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { ReactElement } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'

import MsgDetails from '@/components/safe-messages/MsgDetails'
import MsgSummary from '@/components/safe-messages/MsgSummary'

const ITEM_VALUE = 'message'

const ExpandableMsgItem = ({ msg, expanded = false }: { msg: MessageItem; expanded?: boolean }): ReactElement => {
  return (
    <Accordion defaultValue={expanded ? [ITEM_VALUE] : []}>
      <AccordionItem value={ITEM_VALUE} className="border-b-0">
        <AccordionTrigger
          render={<div role="button" tabIndex={0} />}
          data-testid="message-item"
          className="cursor-pointer justify-start overflow-x-auto py-2 hover:no-underline"
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
