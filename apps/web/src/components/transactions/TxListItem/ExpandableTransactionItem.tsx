import { type Transaction, type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { Accordion, AccordionDetails, AccordionSummary, Box, Skeleton } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TxSummary from '@/components/transactions/TxSummary'
import TxDetails from '@/components/transactions/TxDetails'
import CreateTxInfo from '@/components/transactions/SafeCreationTx'
import { isCreationTxInfo } from '@/utils/transaction-guards'
import { useContext } from 'react'
import { BatchExecuteHoverContext } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import css from './styles.module.css'
import classNames from 'classnames'
import { trackEvent, TX_LIST_EVENTS } from '@/services/analytics'

type ExpandableTransactionItemProps = {
  isConflictGroup?: boolean
  isBulkGroup?: boolean
  item: Transaction
  txDetails?: TransactionDetails
}

export const ExpandableTransactionItem = ({
  isConflictGroup = false,
  isBulkGroup = false,
  item,
  txDetails,
  testId,
}: ExpandableTransactionItemProps & { testId?: string }) => {
  const hoverContext = useContext(BatchExecuteHoverContext)

  const isBatched = hoverContext.activeHover.includes(item.transaction.id)

  return (
    <Accordion
      disableGutters
      TransitionProps={{
        mountOnEnter: true,
        unmountOnExit: false,
      }}
      elevation={0}
      defaultExpanded={!!txDetails}
      className={classNames(css.listItem, { [css.batched]: isBatched })}
      data-testid={testId}
      onChange={(_, expanded) => {
        if (expanded) {
          trackEvent(TX_LIST_EVENTS.EXPAND_TRANSACTION)
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          justifyContent: 'flex-start',
          overflowX: 'auto',
          ['.MuiAccordionSummary-content, .MuiAccordionSummary-content.Mui-expanded']: {
            overflow: 'hidden',
            margin: 0,
            padding: '12px 0',
          },
        }}
        component="div"
      >
        <TxSummary item={item} isConflictGroup={isConflictGroup} isBulkGroup={isBulkGroup} />
      </AccordionSummary>

      <AccordionDetails data-testid="accordion-details" sx={{ padding: 0 }}>
        {isCreationTxInfo(item.transaction.txInfo) ? (
          <CreateTxInfo txSummary={item.transaction} />
        ) : (
          <TxDetails txSummary={item.transaction} txDetails={txDetails} />
        )}
      </AccordionDetails>
    </Accordion>
  )
}

export const TransactionSkeleton = () => (
  <>
    <Box pt="20px" pb="4px">
      <Skeleton variant="text" width="35px" />
    </Box>

    <Accordion disableGutters elevation={0} defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ justifyContent: 'flex-start', overflowX: 'auto' }}>
        <Skeleton width="100%" />
      </AccordionSummary>

      <AccordionDetails sx={{ padding: 0 }}>
        <Skeleton variant="rounded" width="100%" height="325px" />
      </AccordionDetails>
    </Accordion>
  </>
)

export default ExpandableTransactionItem
