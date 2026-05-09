import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { styled as muiStyled } from '@mui/material/styles'
import { Grid2 as Grid } from '@mui/material'

import { CREATE_BATCH_PATH, REVIEW_AND_CONFIRM_PATH } from '../routes/routes'
import QuickTip from '../components/QuickTip'
import { useNetwork, useTransactionLibrary, useTransactions } from '../store'
import useModal from '../hooks/useModal/useModal'
import Button from '../components/Button'
import { Tooltip } from '../components/Tooltip'
import CreateNewBatchCard from '../components/CreateNewBatchCard'
import TransactionsBatchList from '../components/TransactionsBatchList'
import WrongChainBatchModal from '../components/modals/WrongChainBatchModal'

const CreateTransactions = () => {
  const [fileName, setFileName] = useState('')

  const { transactions, removeAllTransactions, replaceTransaction, reorderTransactions, removeTransaction } =
    useTransactions()
  const { importBatch, downloadBatch, saveBatch } = useTransactionLibrary()

  const { chainInfo } = useNetwork()

  const [quickTipOpen, setQuickTipOpen] = useState(true)
  const [fileChainId, setFileChainId] = useState<string>()

  const navigate = useNavigate()

  const { open: showWrongChainModal, openModal: openWrongChainModal, closeModal: closeWrongChainModal } = useModal()

  return (
    <>
      <TransactionsSectionWrapper size={{ xs: 12, md: 6 }}>
        {transactions.length > 0 ? (
          <>
            <TransactionsBatchList
              batchTitle={fileName ? <FileNameTitle filename={fileName} /> : 'Transactions Batch'}
              transactions={transactions}
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
                  state: { from: CREATE_BATCH_PATH },
                })
              }
            >
              Create Batch
            </Button>
            {quickTipOpen && (
              <QuickTipWrapper>
                <QuickTip onClose={() => setQuickTipOpen(false)} />
              </QuickTipWrapper>
            )}
          </>
        ) : (
          <CreateNewBatchCard
            onFileSelected={async (uploadedFile: File | null) => {
              if (uploadedFile) {
                const batchFile = await importBatch(uploadedFile)
                if (!batchFile) return

                setFileName(batchFile.meta.name)
                // we show a modal if the batch file is from a different chain
                const isWrongChain = batchFile.chainId !== chainInfo?.chainId
                if (isWrongChain) {
                  setFileChainId(batchFile.chainId)
                  openWrongChainModal()
                }
              }
            }}
          />
        )}
      </TransactionsSectionWrapper>

      {/* Uploaded batch network modal */}
      {showWrongChainModal && (
        <WrongChainBatchModal onClick={closeWrongChainModal} onClose={closeWrongChainModal} fileChainId={fileChainId} />
      )}
    </>
  )
}

export default CreateTransactions

const TransactionsSectionWrapper = muiStyled(Grid)({
  position: 'sticky',
  top: '80px',
  alignSelf: 'flex-start',
})

const QuickTipWrapper = styled.div`
  margin-left: 35px;
  margin-top: 20px;
`

const UploadedLabel = styled.span`
  margin-left: 4px;
  color: #b2bbc0;
`

const FilenameLabel = styled.div`
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const FileNameTitle = ({ filename }: { filename: string }) => {
  return (
    <>
      <Tooltip title={filename}>
        <FilenameLabel>{filename}</FilenameLabel>
      </Tooltip>{' '}
      <UploadedLabel>uploaded</UploadedLabel>
    </>
  )
}
