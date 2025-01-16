import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import TxCard from '@/components/tx-flow/common/TxCard'
import { TxNote } from './TxNote'
import { TxNoteInput } from './TxNoteInput'
import useSafeInfo from '@/hooks/useSafeInfo'

export function TxNoteForm({
  isCreation,
  txDetails,
  onChange,
}: {
  isCreation: boolean
  txDetails?: TransactionDetails
  onChange: (note: string) => void
}) {
  const { safe } = useSafeInfo()
  if (safe.threshold === 1) return null // Notes don't work yet for 1/X Safes

  // @FIXME: update CGW types to include note
  const note = (txDetails as TransactionDetails & { note: string | null })?.note

  if (!isCreation && !note) return null

  return <TxCard>{isCreation ? <TxNoteInput onChange={onChange} /> : <TxNote txDetails={txDetails} />}</TxCard>
}
