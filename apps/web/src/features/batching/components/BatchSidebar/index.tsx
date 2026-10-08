import { type SyntheticEvent, useEffect } from 'react'
import { useCallback, useContext } from 'react'
import { useDraftBatch, useUpdateBatch } from '@/features/batching'
import { NewTxFlow } from '@/components/tx-flow/flows'
import { TxModalContext } from '@/components/tx-flow'
import { ConfirmBatchFlow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'
import { BatchSidebarView } from '@views/features/batching/components/BatchSidebar/BatchSidebarView'
import BatchTxList from './BatchTxList'

const BatchSidebar = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: (open: boolean) => void }) => {
  const { txFlow, setTxFlow } = useContext(TxModalContext)
  const batchTxs = useDraftBatch()
  const [, deleteTx] = useUpdateBatch()

  const closeSidebar = useCallback(() => {
    onToggle(false)
  }, [onToggle])

  const clearBatch = useCallback(() => {
    batchTxs.forEach((item) => deleteTx(item.id))
  }, [deleteTx, batchTxs])

  // Close confirmation flow when batch is empty
  const isConfirmationFlow = txFlow?.type === ConfirmBatchFlow
  const shouldExitFlow = isConfirmationFlow && batchTxs.length === 0
  useEffect(() => {
    if (shouldExitFlow) {
      setTxFlow(undefined)
    }
  }, [setTxFlow, shouldExitFlow])

  const onAddClick = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      setTxFlow(<NewTxFlow />, undefined, false)
    },
    [setTxFlow],
  )

  const onConfirmClick = useCallback(
    async (e: SyntheticEvent) => {
      e.preventDefault()
      if (!batchTxs.length) return
      closeSidebar()
      setTxFlow(<ConfirmBatchFlow onSubmit={clearBatch} />, undefined, false)
    },
    [setTxFlow, batchTxs, closeSidebar, clearBatch],
  )

  // Close sidebar when txFlow modal is opened
  useEffect(() => {
    if (txFlow) closeSidebar()
  }, [txFlow, closeSidebar])

  return (
    <BatchSidebarView
      isOpen={isOpen}
      txCount={batchTxs.length}
      txList={<BatchTxList txItems={batchTxs} onDelete={deleteTx} />}
      checkWallet={(render) => <CheckWallet>{render}</CheckWallet>}
      onClose={closeSidebar}
      onAddClick={onAddClick}
      onConfirmClick={onConfirmClick}
    />
  )
}

export default BatchSidebar
