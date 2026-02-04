import type { ReactElement } from 'react'
import { useCallback, useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { TxNotesFeature } from '@/features/tx-notes'
import { useLoadFeature } from '@/features/__core__'
import { SlotName, withSlot } from '../slots'

const TxNote = (): ReactElement => {
  const txNotes = useLoadFeature(TxNotesFeature)
  const { encodeTxNote, TxNoteForm } = txNotes
  const { txOrigin, setTxOrigin } = useContext(SafeTxContext)
  const { txDetails, isCreation } = useContext(TxFlowContext)

  const onNoteChange = useCallback(
    (note: string) => {
      setTxOrigin(encodeTxNote(note, txOrigin))
    },
    [setTxOrigin, txOrigin, encodeTxNote],
  )

  return <TxNoteForm isCreation={isCreation} onChange={onNoteChange} txDetails={txDetails} />
}

const useShouldRegisterSlot = () => {
  const { txDetails, isCreation } = useContext(TxFlowContext)

  return isCreation || !!txDetails?.note
}

const TxNoteSlot = withSlot({
  Component: TxNote,
  slotName: SlotName.Main,
  id: 'txNote',
  useSlotCondition: useShouldRegisterSlot,
})

export default TxNoteSlot
