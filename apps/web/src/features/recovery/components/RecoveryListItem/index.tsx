import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useContext, useState } from 'react'
import type { ComponentProps, ReactElement } from 'react'

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
    <Accordion disableGutters elevation={0} expanded={isExpanded} onChange={onChange}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ justifyContent: 'flex-start', overflowX: 'auto' }}>
        <RecoverySummary item={item} />
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <RecoveryDetails item={item} />
      </AccordionDetails>
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
