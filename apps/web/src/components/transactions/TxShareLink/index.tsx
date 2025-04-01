import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Paper, SvgIcon, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import ShareIcon from '@/public/images/messages/link.svg'
import { CopyDeeplinkLabels, trackEvent, TX_LIST_EVENTS } from '@/services/analytics'
import TxShareLink from './TxShareLink'

import css from './styles.module.css'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { useCurrentChain } from '@/hooks/useChains'
import ExplorerButton from '@/components/common/ExplorerButton'

function TxShareAccordion({ noExpand = false }: { noExpand: boolean }) {
  const onExpand = (_: React.SyntheticEvent, expanded: boolean) => {
    if (expanded) {
      trackEvent(TX_LIST_EVENTS.OPEN_SHARE_BLOCK)
    }
  }

  return (
    <Accordion className={css.accordion} onChange={onExpand} disabled={noExpand}>
      <AccordionSummary expandIcon={noExpand ? null : <ExpandMoreIcon />} className={css.summary}>
        <Typography className={css.header}>Share link{!noExpand && ' with other signers'}</Typography>
      </AccordionSummary>

      <AccordionDetails data-testid="share-block-details" className={css.details}>
        If signers have previously subscribed to notifications, they will be notified about signing this transaction.
        You can also share the link with them to speed up the process.
      </AccordionDetails>
    </Accordion>
  )
}

function ExplorerLink({ txHash }: { txHash: string }) {
  const chain = useCurrentChain()
  const explorerLiknk = chain ? getBlockExplorerLink(chain, txHash) : undefined

  return (
    <Button variant="text" size="compact" className={css.button}>
      <ExplorerButton {...explorerLiknk} isCompact={false} fontSize="14px" />
    </Button>
  )
}

export function TxShareBlock({ txId, txHash }: { txId: string; txHash?: string }) {
  return (
    <Paper data-testid="share-block" className={css.wrapper}>
      <TxShareAccordion noExpand={!!txHash} />

      <Box p={2} pt={0.5} display="flex" alignItems="center" gap={1}>
        <TxShareLink id={txId} eventLabel={CopyDeeplinkLabels.shareBlock}>
          <Button
            data-testid="copy-link-btn"
            variant="outlined"
            size="compact"
            startIcon={<SvgIcon component={ShareIcon} inheritViewBox fontSize="small" />}
            className={css.button}
          >
            Copy link
          </Button>
        </TxShareLink>

        {txHash && <ExplorerLink txHash={txHash} />}
      </Box>
    </Paper>
  )
}
