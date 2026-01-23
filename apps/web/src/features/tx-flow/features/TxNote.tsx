import type { ReactElement } from 'react'
import { useCallback, useContext } from 'react'
import { SafeTxContext } from '@/features/tx-flow/contexts/SafeTxProvider'
import { TxFlowContext } from '@/features/tx-flow/contexts/TxFlowProvider'
import { encodeTxNote, TxNoteForm } from '@/features/tx-notes'
import { SlotName, withSlot } from '@/features/tx-flow/contexts/slots'

const TxNote = (): ReactElement => {
  const { txOrigin, setTxOrigin } = useContext(SafeTxContext)
  const { txDetails, isCreation } = useContext(TxFlowContext)

  const onNoteChange = useCallback(
    (note: string) => {
      setTxOrigin(encodeTxNote(note, txOrigin))
    },
    [setTxOrigin, txOrigin],
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
