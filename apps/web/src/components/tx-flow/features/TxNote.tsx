import type { ReactElement } from 'react'
import { useCallback, useContext } from 'react'
import madProps from '@/utils/mad-props'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { encodeTxNote, TxNoteForm } from '@/features/tx-notes'

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
  const onNoteChange = useCallback(
    (note: string) => {
      setTxOrigin(encodeTxNote(note, txOrigin))
    },
    [setTxOrigin, txOrigin],
  )

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
