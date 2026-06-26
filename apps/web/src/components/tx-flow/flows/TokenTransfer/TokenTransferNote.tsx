import { useCallback, useContext } from 'react'
import { Paper, Typography } from '@mui/material'
import { SafeTxContext } from '../../SafeTxProvider'
import { TxFlowContext } from '../../TxFlowProvider'
import { TxNotesFeature } from '@/features/tx-notes'
import { useLoadFeature } from '@/features/__core__'

/**
 * Transaction note as a small sidebar box (moved out of the main form body). Mirrors the wiring of
 * the shared TxNote feature: edits are encoded into txOrigin and submitted with the transaction.
 */
const TokenTransferNote = () => {
  const { encodeTxNote, TxNoteForm } = useLoadFeature(TxNotesFeature)
  const { txOrigin, setTxOrigin } = useContext(SafeTxContext)
  const { txDetails, isCreation } = useContext(TxFlowContext)

  const onNoteChange = useCallback(
    (note: string) => {
      setTxOrigin(encodeTxNote(note, txOrigin))
    },
    [setTxOrigin, txOrigin, encodeTxNote],
  )

  return (
    <Paper sx={{ p: 2 }} data-testid="tx-note-box">
      <Typography variant="overline" color="text.secondary">
        Note
      </Typography>
      <TxNoteForm isCreation={isCreation} onChange={onNoteChange} txDetails={txDetails} />
    </Paper>
  )
}

export default TokenTransferNote
