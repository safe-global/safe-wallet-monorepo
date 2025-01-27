import { Accordion, AccordionDetails, AccordionSummary, Button, Paper, SvgIcon, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { ReactElement } from 'react'

import ShareIcon from '@/public/images/messages/link.svg'
import TxShareLink from '.'

import css from './styles.module.css'

export function TxShareBlock({ txId }: { txId: string }): ReactElement | null {
  return (
    <Paper className={css.wrapper}>
      <Accordion className={css.accordion}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} className={css.summary}>
          <Typography className={css.header}>Share link with other owners</Typography>
        </AccordionSummary>
        <AccordionDetails className={css.details}>
          If owners have previously subscribed to notifications, they will be notified about signing this transaction.
          You can also share the link with them to speed up the process.
        </AccordionDetails>
      </Accordion>
      <div className={css.copy}>
        <TxShareLink id={txId}>
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
