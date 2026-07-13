import type { ReactElement } from 'react'
import { useCallback, useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { TxNotesFeature } from '@/features/tx-notes'
import { useLoadFeature } from '@/features/__core__'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
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

export const useShouldRegisterSlot = () => {
  const { txDetails, isCreation } = useContext(TxFlowContext)
  const isSafeOwner = useIsSafeOwner()

  // Existing notes are only shown to signers; creation input stays available to proposers
  return isCreation || (!!txDetails?.note && isSafeOwner)
}

const TxNoteSlot = withSlot({
  Component: TxNote,
  slotName: SlotName.Main,
  id: 'txNote',
  useSlotCondition: useShouldRegisterSlot,
})

export default TxNoteSlot
