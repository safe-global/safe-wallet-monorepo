import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Grid2 as Grid } from '@mui/material'
import { styled as muiStyled } from '@mui/material/styles'

import TransactionsBatchList from '../components/TransactionsBatchList'
import { CREATE_BATCH_PATH, EDIT_BATCH_PATH, TRANSACTION_LIBRARY_PATH } from '../routes/routes'

import { useTransactionLibrary, useTransactions } from '../store'
import EditableLabel from '../components/EditableLabel'
import Button from '../components/Button'

const EditTransactionLibrary = () => {
  const { transactions, removeAllTransactions, replaceTransaction, reorderTransactions, removeTransaction } =
    useTransactions()
  const { batch, downloadBatch, saveBatch, updateBatch, renameBatch } = useTransactionLibrary()

  const { batchId } = useParams()

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
      {/* Save Batch and redirect to Transaction library */}
      {batch && batchId && (
        <Button
          type="button"
          disabled={!transactions.length}
          style={{ marginLeft: 35 }}
          variant="contained"
          color="primary"
          onClick={() => {
            const { name } = batch
            updateBatch(batchId, name, transactions)
            navigate(TRANSACTION_LIBRARY_PATH, {
              state: { from: EDIT_BATCH_PATH },
            })
          }}
        >
          Save Batch
        </Button>
      )}
    </TransactionsSectionWrapper>
  )
}

export default EditTransactionLibrary

const TransactionsSectionWrapper = muiStyled(Grid)({
  position: 'sticky',
  top: '40px',
  alignSelf: 'flex-start',
})
