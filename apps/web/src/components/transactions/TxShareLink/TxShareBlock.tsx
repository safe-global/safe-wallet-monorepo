import { Accordion, AccordionDetails, AccordionSummary, Button, Paper, SvgIcon, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { ReactElement } from 'react'

import ShareIcon from '@/public/images/messages/link.svg'
import { trackEvent, TX_LIST_EVENTS } from '@/services/analytics'
import TxShareLink from '.'

import css from './styles.module.css'

export function TxShareBlock({ txId }: { txId: string }): ReactElement | null {
  const onExpand = (_: React.SyntheticEvent, expanded: boolean) => {
    if (expanded) {
      trackEvent(TX_LIST_EVENTS.OPEN_SHARE_BLOCK)
    }
  }

  return (
    <Paper className={css.wrapper}>
      <Accordion className={css.accordion} onChange={onExpand}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} className={css.summary}>
          <Typography className={css.header}>Share link with other signers</Typography>
        </AccordionSummary>
        <AccordionDetails className={css.details}>
          If signers have previously subscribed to notifications, they will be notified about signing this transaction.
          You can also share the link with them to speed up the process.
        </AccordionDetails>
      </Accordion>
      <div className={css.copy}>
        <TxShareLink id={txId} eventLabel="share-block">
          <Button
            variant="outlined"
            size="compact"
            startIcon={<SvgIcon component={ShareIcon} inheritViewBox fontSize="small" className={css.icon} />}
            className={css.button}
          >
            Copy link
          </Button>
        </TxShareLink>
      </div>
    </Paper>
  )
}
