import { useContext, useState } from 'react'
import type { ComponentProps, ReactElement } from 'react'

import TxListAccordionItem, { TX_LIST_ITEM_VALUE } from '@/components/transactions/TxListItem/TxListAccordionItem'
import RecoverySummary from '../RecoverySummary'
import RecoveryDetails from '../RecoveryDetails'
import { RecoveryListItemContext, RecoveryListItemProvider } from './RecoveryListItemContext'
import type { RecoveryQueueItem } from '../../services/recovery-state'

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
    <TxListAccordionItem
      value={isExpanded ? [TX_LIST_ITEM_VALUE] : []}
      onValueChange={onChange}
      testId="recovery-item"
      summary={<RecoverySummary item={item} />}
      details={<RecoveryDetails item={item} />}
    />
  )
}

export default function RecoveryListItem(props: ComponentProps<typeof ProvidedRecoveryListItem>): ReactElement {
  return (
    <RecoveryListItemProvider>
      <ProvidedRecoveryListItem {...props} />
    </RecoveryListItemProvider>
  )
}
