import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Dispatch, ReactElement, SetStateAction } from 'react'
import { Backdrop, Typography, Box, IconButton, Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { ClickAwayListener } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import useTxQueue from '@/hooks/useTxQueue'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import styles from './styles.module.css'
import { getQueuedTransactionCount } from '@/utils/transactions'
import { BatchExecuteHoverProvider } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import BatchExecuteButton from '@/components/transactions/BatchExecuteButton'

type Props = {
  expanded: boolean
  visible: boolean
  setExpanded: Dispatch<SetStateAction<boolean>>
  onDismiss: () => void
  transactions: TransactionItemPage
}

const TransactionQueueBar = ({
  expanded,
  visible,
  setExpanded,
  onDismiss,
  transactions,
}: Props): ReactElement | null => {
  if (!visible || transactions.results.length === 0) {
    return null
  }

  const queuedTxCount = getQueuedTransactionCount(transactions)

  // if you inline the expression, it will split put the `queuedTxCount` on a new line
  // and make it harder to find this text for matchers in tests
  const barTitle = `(${queuedTxCount}) Transaction queue`
  return (
    <>
      <Box className={styles.barWrapper}>
        <ClickAwayListener onClickAway={() => setExpanded(false)} mouseEvent="onMouseDown" touchEvent="onTouchStart">
          <Accordion
            expanded={expanded}
            onChange={() => setExpanded((prev) => !prev)}
            TransitionProps={{
              timeout: {
                appear: 400,
                enter: 0,
                exit: 500,
              },
              unmountOnExit: false,
              mountOnEnter: true,
            }}
            sx={{
              // there are very specific rules for the border radius that we have to override
              borderBottomLeftRadius: '0 !important',
              borderBottomRightRadius: '0 !important',
            }}
          >
            <AccordionSummary
              sx={{ '.MuiAccordionSummary-content': { alignItems: 'center' }, height: TRANSACTION_BAR_HEIGHT }}
            >
              <Typography variant="body1" color="primary.main" fontWeight={700} sx={{ mr: 'auto' }}>
                {barTitle}
              </Typography>

              <IconButton
                onClick={(event) => {
                  event.stopPropagation()
                  setExpanded((prev) => !prev)
                }}
                aria-label={`${expanded ? 'close' : 'expand'} transaction queue bar`}
                sx={{ transform: expanded ? 'rotate(180deg)' : undefined }}
              >
                <ExpandLessIcon />
              </IconButton>
              <IconButton onClick={onDismiss} aria-label="dismiss transaction queue bar">
                <CloseIcon />
              </IconButton>
            </AccordionSummary>
            <AccordionDetails>
              <BatchExecuteHoverProvider>
                <Box display="flex" flexDirection="column" alignItems="flex-end">
                  <BatchExecuteButton />
                </Box>
                <PaginatedTxns useTxns={useTxQueue} />
              </BatchExecuteHoverProvider>
            </AccordionDetails>
          </Accordion>
        </ClickAwayListener>
      </Box>
      <Backdrop open={expanded} />
    </>
  )
}

export const TRANSACTION_BAR_HEIGHT = '64px'

export default TransactionQueueBar
