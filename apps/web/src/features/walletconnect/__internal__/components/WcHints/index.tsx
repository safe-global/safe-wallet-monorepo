import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionSummary,
  Avatar,
  Box,
  Typography,
  AccordionDetails,
  SvgIcon,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material'
import { useState } from 'react'
import type { ReactElement } from 'react'
import Question from '@/public/images/common/question.svg'
import css from './styles.module.css'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'

const HintAccordion = ({
  title,
  items,
  expanded,
  onExpand,
}: {
  title: string
  items: Array<string>
  expanded: boolean
  onExpand: () => void
}): ReactElement => {
  return (
    <Accordion onClick={onExpand} expanded={expanded}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography className={css.title}>
          <SvgIcon component={Question} inheritViewBox className={css.questionIcon} />
          {title}
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <List className={css.list}>
          {items.map((item, i) => (
            <ListItem key={i} sx={{ p: 0 }}>
              <ListItemAvatar className={css.listItemAvatar}>
                <Avatar className={css.avatar}>{i + 1}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={item} sx={{ m: 0 }} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  )
}

const ConnectionTitle = 'How do I connect to a dApp?'
const ConnectionSteps = [
  'Open a WalletConnect supported dApp',
  'Connect a wallet',
  'Select WalletConnect as the wallet',
  'Copy the pairing code and paste it into the input field above',
  'Approve the session',
  'dApp is now connected to the Safe',
]

const InteractionTitle = 'How do I interact with a dApp?'
const InteractionSteps = [
  'Connect a dApp by following the above steps',
  'Ensure the dApp is connected to the same chain as your Safe Account',
  'Initiate a transaction/signature request via the dApp',
  'Transact/sign as normal via the Safe',
]

const WcHints = (): ReactElement => {
  const [expandedAccordion, setExpandedAccordion] = useState<'connection' | 'interaction' | null>(null)

  const onExpand = (accordion: 'connection' | 'interaction') => {
    setExpandedAccordion((prev) => {
      return prev === accordion ? null : accordion
    })

    trackEvent(WALLETCONNECT_EVENTS.HINTS_EXPAND)
  }

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <HintAccordion
        title={ConnectionTitle}
        items={ConnectionSteps}
        onExpand={() => onExpand('connection')}
        expanded={expandedAccordion === 'connection'}
      />
      <HintAccordion
        title={InteractionTitle}
        items={InteractionSteps}
        onExpand={() => onExpand('interaction')}
        expanded={expandedAccordion === 'interaction'}
      />
    </Box>
  )
}

export default WcHints
