import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { TxNote } from './TxNote'
import { TxNoteInput } from './TxNoteInput'
import { Box } from '@mui/material'

export function TxNoteForm({
  isCreation,
  txDetails,
  onChange,
}: {
  isCreation: boolean
  txDetails?: TransactionDetails
  onChange: (note: string) => void
}) {
  if (!isCreation && !txDetails?.note) return null

  return <Box pt={3}>{isCreation ? <TxNoteInput onChange={onChange} /> : <TxNote txDetails={txDetails} />}</Box>
}
