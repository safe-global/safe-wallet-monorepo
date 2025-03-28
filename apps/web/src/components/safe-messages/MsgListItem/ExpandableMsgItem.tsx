import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { Accordion, AccordionDetails, AccordionSummary, Box } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { ReactElement } from 'react'
import { ErrorBoundary } from '@sentry/react'

import MsgDetails from '@/components/safe-messages/MsgDetails'
import MsgSummary from '@/components/safe-messages/MsgSummary'

import txListItemCss from '@/components/transactions/TxListItem/styles.module.css'

const ExpandableMsgItem = ({ msg, expanded = false }: { msg: MessageItem; expanded?: boolean }): ReactElement => {
  return (
    <Accordion
      defaultExpanded={expanded}
      disableGutters
      elevation={0}
      className={txListItemCss.accordion}
      sx={{ border: 'none', '&:before': { display: 'none' } }}
    >
      <AccordionSummary
        data-testid="message-item"
        expandIcon={<ExpandMoreIcon />}
        sx={{ justifyContent: 'flex-start', overflowX: 'auto' }}
      >
        <MsgSummary msg={msg} />
      </AccordionSummary>

      <AccordionDetails sx={{ padding: 0 }}>
        <ErrorBoundary fallback={<Box sx={{ p: 2 }}>Failed to render message details</Box>}>
          <MsgDetails msg={msg} />
        </ErrorBoundary>
      </AccordionDetails>
    </Accordion>
  )
}

export default ExpandableMsgItem
