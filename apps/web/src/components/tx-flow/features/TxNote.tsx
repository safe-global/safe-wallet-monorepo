import type { ReactElement } from 'react'
import { useCallback, useContext } from 'react'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import TxNoteForm from '@/features/tx-notes/public/components/TxNoteForm'
import { encodeTxNote } from '@/features/tx-notes/public/utils/encodeTxNote'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '@/components/tx-flow/slots/withSlot'

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
