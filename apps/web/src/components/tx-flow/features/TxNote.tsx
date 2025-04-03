import type { ReactElement } from 'react'
import { useCallback, useContext } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { encodeTxNote, TxNoteForm } from '@/features/tx-notes'
import { SlotName, useRegisterSlot } from '../SlotProvider'

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

const RegisterTxNote = () => {
  const { txDetails, isCreation } = useContext(TxFlowContext)

  useRegisterSlot(SlotName.Feature, 'txNote', TxNote, isCreation || !!txDetails?.note)

  return false
}

export default RegisterTxNote
