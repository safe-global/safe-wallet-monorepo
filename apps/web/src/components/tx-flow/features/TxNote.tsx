import type { ReactElement } from 'react'
import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import TxNoteForm from '@/features/tx-notes/public/components/TxNoteForm'
import { usePrivateNote, usePrivateNotesPrototype } from '@/features/tx-notes/public/services/privateNotesPrototype'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '@/components/tx-flow/slots/withSlot'

const TxNote = (): ReactElement => {
  const { txDetails, isCreation } = useContext(TxFlowContext)

  // Prototype: a private note is kept for the Workspace, never written to the transaction's public origin
  const { setDraft } = usePrivateNotesPrototype()

  return <TxNoteForm isCreation={isCreation} onChange={setDraft} txDetails={txDetails} />
}

const useShouldRegisterSlot = () => {
  const { txDetails, isCreation } = useContext(TxFlowContext)
  const privateNote = usePrivateNote(txDetails?.txId)

  return isCreation || !!txDetails?.note || !!privateNote
}

const TxNoteSlot = withSlot({
  Component: TxNote,
  slotName: SlotName.Main,
  id: 'txNote',
  useSlotCondition: useShouldRegisterSlot,
})

export default TxNoteSlot
