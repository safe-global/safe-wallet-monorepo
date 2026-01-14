import { AccordionDetails, IconButton } from '@mui/material'
import { memo, useState } from 'react'
import { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import styled from 'styled-components'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { ProposedTransaction } from '../typings/models'
import TransactionDetails from './TransactionDetails'
import { getTransactionText } from '../utils'
import Text from './Text'
import { Accordion, AccordionSummary } from './Accordion'
import { Tooltip } from './Tooltip'
import EthHashInfo from './ETHHashInfo'
import { Icon } from './Icon'
import FixedIcon from './FixedIcon'
import Dot from './Dot'

const UNKNOWN_POSITION_LABEL = '?'
const minArrowSize = '12'

type TransactionProps = {
  transaction: ProposedTransaction
  provided: DraggableProvided
  snapshot: DraggableStateSnapshot
  isLastTransaction: boolean
  showTransactionDetails: boolean
  index: number
  draggableTxIndexDestination: number | undefined
  draggableTxIndexOrigin: number | undefined
  reorderTransactions?: (sourceIndex: number, destinationIndex: number) => void
  networkPrefix: string | undefined
  replaceTransaction?: (newTransaction: ProposedTransaction, index: number) => void
  setTxIndexToEdit: (index: string) => void
  openEditTxModal: () => void
  removeTransaction?: (index: number) => void
  setTxIndexToRemove: (index: string) => void
  openDeleteTxModal: () => void
}

const TransactionBatchListItem = memo(
  ({
    transaction,
    provided,
    snapshot,
    isLastTransaction,
    showTransactionDetails,
    index,
    draggableTxIndexDestination,
    draggableTxIndexOrigin,
    reorderTransactions,
    networkPrefix,
    replaceTransaction,
    setTxIndexToEdit,
    openEditTxModal,
    removeTransaction,
    setTxIndexToRemove,
    openDeleteTxModal,
  }: TransactionProps) => {
    const { description } = transaction
    const { to } = description

    const transactionDescription = getTransactionText(description)

    const [isTxExpanded, setTxExpanded] = useState(false)

    const onClickShowTransactionDetails = () => {
      if (showTransactionDetails) {
        setTxExpanded((isTxExpanded) => !isTxExpanded)
      }
    }
    const isThisTxBeingDragging = snapshot.isDragging

    const showArrowAdornment = !isLastTransaction && !isThisTxBeingDragging

    // displayed order can change if the user uses the drag and drop feature
    const displayedTxPosition = getDisplayedTxPosition(
      index,
      isThisTxBeingDragging,
      draggableTxIndexDestination,
      draggableTxIndexOrigin,
    )

    return (
      <TransactionListItem ref={provided.innerRef} {...provided.draggableProps}>
        {/* Transacion Position */}
        <PositionWrapper>
          <PositionDot color="primary" isDragging={isThisTxBeingDragging}>
            <Text>{displayedTxPosition}</Text>
          </PositionDot>
          {showArrowAdornment && <ArrowAdornment />}
        </PositionWrapper>

        {/* Transaction Description */}
        <StyledAccordion
          expanded={isTxExpanded}
          compact
          onChange={onClickShowTransactionDetails}
          isDragging={isThisTxBeingDragging}
          TransitionProps={{ unmountOnExit: true }}
        >
          <div {...provided.dragHandleProps}>
            <AccordionSummary expandIcon={false} style={{ cursor: reorderTransactions ? 'grab' : 'pointer' }}>
              {/* Drag & Drop Indicator */}
              {reorderTransactions && (
                <Tooltip placement="top" title="Drag and Drop" backgroundColor="primary" arrow>
                  <DragAndDropIndicatorIcon fontSize="small" />
                </Tooltip>
              )}

              {/* Destination Address label */}
              <StyledEthHashInfo shortName={networkPrefix || ''} hash={to} shortenHash={4} shouldShowShortName />

              {/* Transaction Description label */}
              <TransactionsDescription>{transactionDescription}</TransactionsDescription>

              {/* Transaction Actions */}

              {/* Edit transaction */}
              {replaceTransaction && (
                <Tooltip title="Edit transaction" backgroundColor="primary" arrow>
                  <TransactionActionButton
                    size="medium"
                    aria-label="Edit transaction"
                    onClick={(event) => {
                      event.stopPropagation()
                      setTxIndexToEdit(String(index))
                      openEditTxModal()
                    }}
                  >
                    <Icon size="sm" type="edit" />
                  </TransactionActionButton>
                </Tooltip>
              )}

              {/* Delete transaction */}
              {removeTransaction && (
                <Tooltip placement="top" title="Delete transaction" backgroundColor="primary" arrow>
                  <TransactionActionButton
                    onClick={(event) => {
                      event.stopPropagation()
                      setTxIndexToRemove(String(index))
                      openDeleteTxModal()
                    }}
                    size="medium"
                    aria-label="Delete transaction"
                  >
                    <Icon size="sm" type="delete" />
                  </TransactionActionButton>
                </Tooltip>
              )}

              {/* Expand transaction details */}
              {showTransactionDetails && (
                <Tooltip placement="top" title="Expand transaction details" backgroundColor="primary" arrow>
                  <TransactionActionButton
                    onClick={(event) => {
                      event.stopPropagation()
                      onClickShowTransactionDetails()
                    }}
                    size="medium"
                    aria-label="Expand transaction details"
                  >
                    <StyledArrow isTxExpanded={isTxExpanded} type={'chevronDown'} />
                  </TransactionActionButton>
                </Tooltip>
              )}
            </AccordionSummary>
          </div>

          {/* Transaction details */}
          <AccordionDetails>
            <TransactionDetails transaction={transaction} />
          </AccordionDetails>
        </StyledAccordion>
      </TransactionListItem>
    )
  },
)

const getDisplayedTxPosition = (
  index: number,
  isDraggingThisTx: boolean,
  draggableTxIndexDestination?: number,
  draggableTxIndexOrigin?: number,
): string => {
  // we show the correct position in the transaction that is being dragged
  if (isDraggingThisTx) {
    const isAwayFromDroppableZone = draggableTxIndexDestination === undefined
    return isAwayFromDroppableZone ? UNKNOWN_POSITION_LABEL : String(draggableTxIndexDestination + 1)
  }

  // if a transaction is being dragged, we show the correct position in previous transactions
  if (index < Number(draggableTxIndexOrigin)) {
    // depending on the current destination we show the correct position
    return index >= Number(draggableTxIndexDestination) ? `${index + 2}` : `${index + 1}`
  }

  // if a transaction is being dragged, we show the correct position in next transactions
  if (index > Number(draggableTxIndexOrigin)) {
    // depending on the current destination we show the correct position
    return index > Number(draggableTxIndexDestination) ? `${index + 1}` : `${index}`
  }

  // otherwise we show the natural position
  return `${index + 1}`
}

const TransactionListItem = styled.li`
  display: flex;
  margin-bottom: 8px;
`

const StyledArrow = styled(FixedIcon)<{ isTxExpanded: boolean }>`
  .icon-color {
    fill: #b2b5b2;
  }
  ${({ isTxExpanded }) =>
    isTxExpanded &&
    `
    transform: rotateZ(180deg);

  `}
`

const PositionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 10px 0 0;
`

const PositionDot = styled(Dot).withConfig({
  shouldForwardProp: (prop, defaultValidatorFn) => defaultValidatorFn(prop),
})<{ isDragging: boolean }>`
  height: 24px;
  width: 24px;
  min-width: 24px;
  background-color: ${({ theme }) => theme.palette.border.light};
  transition: background-color 0.5s linear;
`

const ArrowAdornment = styled.div`
  position: relative;
  border-left: 1px solid ${({ theme }) => theme.palette.border.light};
  flex-grow: 1;
  margin-top: 8px;

  &&::before {
    content: ' ';
    display: inline-block;
    position: absolute;
    border-left: 1px solid ${({ theme }) => theme.palette.border.light};

    height: ${minArrowSize}px;
    bottom: -${minArrowSize}px;
    left: -1px;
  }

  &&::after {
    content: ' ';
    display: inline-block;
    position: absolute;
    bottom: -${minArrowSize}px;
    left: -4px;

    border-width: 0 1px 1px 0;
    border-style: solid;
    border-color: ${({ theme }) => theme.palette.border.light};
    padding: 3px;

    transform: rotate(45deg);
  }
`

// transaction description styles

const StyledAccordion = styled(Accordion).withConfig({
  shouldForwardProp: (prop) => !['isDragging'].includes(prop),
})<{ isDragging: boolean }>`
  flex-grow: 1;

  &.MuiAccordion-root {
    margin-bottom: 0;
    border-width: 1px;
    border-color: ${({ isDragging, expanded, theme }) =>
      isDragging || expanded ? theme.palette.secondary.light : theme.palette.background.paper};
    transition: border-color 0.5s linear;

    &:hover {
      border-color: ${({ theme }) => theme.palette.secondary.light};

      .MuiAccordionSummary-root {
        background-color: ${({ theme }) => theme.palette.secondary.background};
      }
    }
  }

  .MuiAccordionSummary-root {
    height: 52px;
    padding: 0px 8px;
    background-color: ${({ isDragging, theme }) =>
      isDragging ? theme.palette.secondary.background : theme.palette.background.paper};

    .MuiIconButton-root {
      padding: 8px;
    }

    &.Mui-expanded {
      border-width: 1px;
      background-color: ${({ theme }) => theme.palette.secondary.background};
      border-color: ${({ isDragging, expanded, theme }) =>
        isDragging || expanded ? theme.palette.secondary.light : '#e8e7e6'};
    }
  }

  .MuiAccordionSummary-content {
    max-width: 100%;
    align-items: center;
  }
`

const TransactionActionButton = styled(IconButton)`
  height: 32px;
  width: 32px;
  padding: 0;
`

const TransactionsDescription = styled(Text)`
  && {
    flex-grow: 1;
    padding-left: 24px;
    font-size: 14px;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

const DragAndDropIndicatorIcon = styled(DragIndicatorIcon)`
  color: #b2bbc0;
  margin-right: 4px;
`

const StyledEthHashInfo = styled(EthHashInfo)`
  p {
    font-size: 14px;
  }
`

export default TransactionBatchListItem
