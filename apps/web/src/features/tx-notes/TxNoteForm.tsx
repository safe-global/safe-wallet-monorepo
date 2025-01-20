import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import TxCard from '@/components/tx-flow/common/TxCard'
import { TxNote } from './TxNote'
import { TxNoteInput } from './TxNoteInput'

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

  return <TxCard>{isCreation ? <TxNoteInput onChange={onChange} /> : <TxNote txDetails={txDetails} />}</TxCard>
}
