import type { ReactElement } from 'react'
import { useCallback, useContext, useState } from 'react'
import madProps from '@/utils/mad-props'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow-2/TxFlowProvider'
import { encodeTxNote, trackAddNote, TxNoteForm } from '@/features/tx-notes'
import { TxFlowEvent, useOnEvent } from '../txFlowEvents'

export const TxNote = ({
  txDetails,
  isCreation,
  txOrigin,
  setTxOrigin,
}: {
  txDetails: ReturnType<typeof useTxDetails>
  isCreation: ReturnType<typeof useIsCreation>
  txOrigin: ReturnType<typeof useTxOrigin>
  setTxOrigin: ReturnType<typeof useSetTxOrigin>
}): ReactElement | null => {
  const [customOrigin, setCustomOrigin] = useState<string | undefined>(txOrigin)

  const onNoteChange = useCallback(
    (note: string) => {
      setCustomOrigin(encodeTxNote(note, txOrigin))
    },
    [setCustomOrigin, txOrigin],
  )

  const handleNextStep = useCallback(() => {
    if (customOrigin !== txOrigin) {
      trackAddNote()
    }
    setTxOrigin(customOrigin)
  }, [customOrigin, setTxOrigin, txOrigin])

  // Subscribe to the NEXT event to track the note change
  useOnEvent(TxFlowEvent.NEXT, handleNextStep)

  return <TxNoteForm isCreation={isCreation} onChange={onNoteChange} txDetails={txDetails} />
}

const useTxDetails = () => useContext(TxFlowContext).txDetails
const useIsCreation = () => useContext(TxFlowContext).isCreation
const useTxOrigin = () => useContext(SafeTxContext).txOrigin
const useSetTxOrigin = () => useContext(SafeTxContext).setTxOrigin

export default madProps(TxNote, {
  txDetails: useTxDetails,
  isCreation: useIsCreation,
  txOrigin: useTxOrigin,
  setTxOrigin: useSetTxOrigin,
})
