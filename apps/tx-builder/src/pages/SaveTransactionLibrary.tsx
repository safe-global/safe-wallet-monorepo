import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid2 as Grid } from '@mui/material'
import { styled as muiStyled } from '@mui/material/styles'

import TransactionsBatchList from '../components/TransactionsBatchList'
import { useTransactionLibrary, useTransactions } from '../store'
import { CREATE_BATCH_PATH, REVIEW_AND_CONFIRM_PATH, SAVE_BATCH_PATH } from '../routes/routes'
import EditableLabel from '../components/EditableLabel'
import Button from '../components/Button'

const SaveTransactionLibrary = () => {
  const { transactions, removeAllTransactions, replaceTransaction, reorderTransactions, removeTransaction } =
    useTransactions()
  const { downloadBatch, saveBatch, batch, renameBatch } = useTransactionLibrary()

  const navigate = useNavigate()

  useEffect(() => {
    if (transactions.length === 0) {
      navigate(CREATE_BATCH_PATH)
    }
  }, [transactions, navigate])

  return (
    <TransactionsSectionWrapper size={{ xs: 12, md: 6 }}>
      <TransactionsBatchList
        transactions={transactions}
        batchTitle={
          batch && (
            <EditableLabel key={batch.name} onEdit={(newBatchName) => renameBatch(batch.id, newBatchName)}>
              {batch.name}
            </EditableLabel>
          )
        }
        removeTransaction={removeTransaction}
        saveBatch={saveBatch}
        downloadBatch={downloadBatch}
        removeAllTransactions={removeAllTransactions}
        replaceTransaction={replaceTransaction}
        reorderTransactions={reorderTransactions}
        showTransactionDetails={false}
        showBatchHeader
      />
      {/* Go to Review Screen button */}
      <Button
        type="button"
        disabled={!transactions.length}
        style={{ marginLeft: 35 }}
        variant="contained"
        color="primary"
        onClick={() =>
          navigate(REVIEW_AND_CONFIRM_PATH, {
            state: { from: SAVE_BATCH_PATH },
          })
        }
      >
        Create Batch
      </Button>
    </TransactionsSectionWrapper>
  )
}

export default SaveTransactionLibrary

const TransactionsSectionWrapper = muiStyled(Grid)({
  position: 'sticky',
  top: '40px',
  alignSelf: 'flex-start',
})
