import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'

import DeleteBatchModal from '../components/modals/DeleteBatchModal'
import TransactionsBatchList from '../components/TransactionsBatchList'
import useModal from '../hooks/useModal/useModal'
import { HOME_PATH } from '../routes/routes'
import SuccessBatchCreationModal from '../components/modals/SuccessBatchCreationModal'
import { useTransactionLibrary, useTransactions } from '../store'
import { useSimulation } from '../hooks/useSimulation'
import { FETCH_STATUS } from '../utils'
import Button from '../components/Button'
import FixedIcon from '../components/FixedIcon'
import Text from '../components/Text'
import Link from '../components/Link'
import ButtonLink from '../components/buttons/ButtonLink'
import { Typography } from '@mui/material'
import Loader from '../components/Loader'
import IconText from '../components/IconText'
import Card from '../components/Card'
import Wrapper from '../components/Wrapper'

const ReviewAndConfirm = () => {
  const {
    open: showSuccessBatchModal,
    openModal: openSuccessBatchModal,
    closeModal: closeSuccessBatchModal,
  } = useModal()
  const { open: showDeleteBatchModal, openModal: openDeleteBatchModal, closeModal: closeDeleteBatchModal } = useModal()
  const {
    transactions,
    removeTransaction,
    removeAllTransactions,
    replaceTransaction,
    submitTransactions,
    reorderTransactions,
  } = useTransactions()
  const { downloadBatch, saveBatch } = useTransactionLibrary()
  const [showSimulation, setShowSimulation] = useState<boolean>(false)
  const { simulation, simulateTransaction, simulationRequestStatus, simulationLink, simulationSupported } =
    useSimulation()
  const navigate = useNavigate()

  const clickSimulate = () => {
    simulateTransaction()
    setShowSimulation(true)
  }

  const closeSimulation = () => setShowSimulation(false)

  const createBatch = async () => {
    try {
      await submitTransactions()
      openSuccessBatchModal()
    } catch (e) {
      console.error('Error sending transactions:', e)
    }
  }

  useEffect(() => {
    const hasTransactions = transactions.length > 0

    if (!hasTransactions) {
      navigate(HOME_PATH)
    }
  }, [transactions, navigate])

  return (
    <>
      <Wrapper centered>
        <StyledTitle>Review and Confirm</StyledTitle>

        <TransactionsBatchList
          batchTitle={'Transactions Batch'}
          transactions={transactions}
          removeTransaction={removeTransaction}
          saveBatch={saveBatch}
          downloadBatch={downloadBatch}
          reorderTransactions={reorderTransactions}
          replaceTransaction={replaceTransaction}
          showTransactionDetails
          showBatchHeader
        />

        <ButtonsWrapper>
          {/* Send batch button */}
          <Button
            type="button"
            disabled={!transactions.length}
            variant="contained"
            color="primary"
            onClick={createBatch}
          >
            <FixedIcon type={'arrowSentWhite'} />
            <StyledButtonLabel>Send Batch</StyledButtonLabel>
          </Button>

          {/* Cancel batch button */}
          <Button type="button" disabled={!transactions.length} color="error" onClick={openDeleteBatchModal}>
            Cancel
          </Button>

          {/* Simulate batch button */}
          {simulationSupported && (
            <Button type="button" variant="bordered" color="primary" onClick={clickSimulate}>
              Simulate
            </Button>
          )}
        </ButtonsWrapper>

        {/* Simulation statuses */}
        {showSimulation && (
          <SimulationContainer>
            <StyledButton iconType="cross" iconSize="sm" color="primary" onClick={closeSimulation}></StyledButton>
            {simulationRequestStatus === FETCH_STATUS.ERROR && (
              <Text color="error">An unexpected error occurred during simulation.</Text>
            )}

            {simulationRequestStatus === FETCH_STATUS.LOADING && (
              <>
                <Loader size="xs" />
                <Text>Running simulation...</Text>
              </>
            )}

            {simulationRequestStatus === FETCH_STATUS.SUCCESS && (
              <>
                {!simulation.simulation.status && (
                  <>
                    <IconText iconSize="md" iconType="alert" iconColor="error" text="Failed" color="error" />
                    <Text variant="body2">
                      The batch failed during the simulation throwing error{' '}
                      <b>{simulation.transaction.error_message}</b> in the contract at{' '}
                      <b>{simulation.transaction.error_info?.address}</b>. Full simulation report is available{' '}
                      <Link href={simulationLink} target="_blank" rel="noreferrer">
                        <b>on Tenderly</b>
                      </Link>
                      .
                    </Text>
                  </>
                )}
                {simulation.simulation.status && (
                  <>
                    <IconText iconSize="md" iconType="check" iconColor="primary" text="Success" color="primary" />
                    <Text variant="body2">
                      The batch was successfully simulated. Full simulation report is available{' '}
                      <Link href={simulationLink} target="_blank" rel="noreferrer">
                        <b>on Tenderly</b>
                      </Link>
                      .
                    </Text>
                  </>
                )}
              </>
            )}
          </SimulationContainer>
        )}
      </Wrapper>

      {/* Delete batch modal */}
      {showDeleteBatchModal && (
        <DeleteBatchModal count={transactions.length} onClick={removeAllTransactions} onClose={closeDeleteBatchModal} />
      )}

      {/* Success batch modal */}
      {showSuccessBatchModal && (
        <SuccessBatchCreationModal
          count={transactions.length}
          onClick={() => {
            removeAllTransactions()
            closeSuccessBatchModal()
          }}
          onClose={() => {
            removeAllTransactions()
            closeSuccessBatchModal()
          }}
        />
      )}
    </>
  )
}

export default ReviewAndConfirm

const StyledButton = styled(ButtonLink)`
  && {
    position: absolute;
    right: 26px;
    padding: 5px;
    width: 26px;
    height: 26px;

    :hover {
      background: ${({ theme }) => theme.palette.divider};
      border-radius: 16px;
    }
  }
`

const SimulationContainer = styled(Card)`
  box-shadow: none;
  margin: 24px 0 0 34px;
  background: ${({ theme }) => theme.palette.background.paper};

  // last child is the status result
  & > :last-child {
    margin-top: 11px;
  }
`

const StyledTitle = styled(Typography)`
  && {
    margin-top: 0px;
    margin-bottom: 1rem;
    font-size: 20px;
    font-weight: 700;
    line-height: normal;
  }
`

const ButtonsWrapper = styled.div`
  display: flex;
  margin-top: 24px;
  padding: 0 0 0 34px;

  > button + button {
    margin-left: 16px;
  }

  > :last-child {
    margin-left: auto;
    margin-right: 0;
  }
`

const StyledButtonLabel = styled.span`
  margin-left: 8px;
`
