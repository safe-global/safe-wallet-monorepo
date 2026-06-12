import { useContext, useState } from 'react'
import type { ComponentProps, ReactElement } from 'react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import RecoverySummary from '../RecoverySummary'
import RecoveryDetails from '../RecoveryDetails'
import { RecoveryListItemContext, RecoveryListItemProvider } from './RecoveryListItemContext'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

function ProvidedRecoveryListItem({ item }: { item: RecoveryQueueItem }): ReactElement {
  const { submitError, setSubmitError } = useContext(RecoveryListItemContext)
  const [expanded, setExpanded] = useState(false)

  const isExpanded = !!submitError || expanded

  const onChange = () => {
    if (isExpanded) {
      setExpanded(false)
      setSubmitError(undefined)
    } else {
      setExpanded(true)
    }
  }

  return (
    <Accordion value={isExpanded ? ['recovery'] : []} onValueChange={onChange}>
      <AccordionItem value="recovery" className="border-b-0">
        <AccordionTrigger render={<div role="button" tabIndex={0} />} className="justify-start gap-2 overflow-x-auto">
          <RecoverySummary item={item} />
        </AccordionTrigger>

        <AccordionContent className="p-0">
          <RecoveryDetails item={item} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default function RecoveryListItem(props: ComponentProps<typeof ProvidedRecoveryListItem>): ReactElement {
  return (
    <RecoveryListItemProvider>
      <ProvidedRecoveryListItem {...props} />
    </RecoveryListItemProvider>
  )
}
