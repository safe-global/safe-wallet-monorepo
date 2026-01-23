import { useCallback, useContext, useEffect, useState } from 'react'
import useTxQueue from '@/hooks/useTxQueue'
import { TxModalContext } from '@/features/tx-flow'

const useTransactionQueueBarState = () => {
  const [expanded, setExpanded] = useState(false)
  const [dismissedByUser, setDismissedByUser] = useState(false)
  const { page = { results: [] } } = useTxQueue()
  const { txFlow } = useContext(TxModalContext)

  const dismissQueueBar = useCallback((): void => {
    setDismissedByUser(true)
  }, [])

  useEffect(() => {
    if (txFlow) setExpanded(false)
  }, [txFlow])

  return {
    expanded,
    dismissedByUser,
    setExpanded,
    dismissQueueBar,
    transactions: page,
  }
}

export default useTransactionQueueBarState
