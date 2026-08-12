import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import TxNote from '../TxNote'
import TxNoteInput from '../TxNoteInput'

export default function TxNoteForm({
  isCreation,
  txDetails,
  onChange,
}: {
  isCreation: boolean
  txDetails?: TransactionDetails
  onChange: (note: string) => void
}) {
  if (!isCreation && !txDetails?.note) return null

  return (
    <div className="pt-6">{isCreation ? <TxNoteInput onChange={onChange} /> : <TxNote txDetails={txDetails} />}</div>
  )
}
