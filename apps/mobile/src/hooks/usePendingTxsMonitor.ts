import { PendingStatus, selectPendingTxs } from '@/src/store/pendingTxsSlice'
import { useAppSelector } from '../store/hooks'
import { useToastController } from '@tamagui/toast'
import { useRef } from 'react'

export const usePendingTxsMonitor = () => {
  const isDispatched = useRef<Record<string, boolean>>({})
  const pendingTxs = useAppSelector(selectPendingTxs)
  const toast = useToastController()

  Object.entries(pendingTxs).forEach(([_txId, pendingTx]) => {
    if (pendingTx.status === PendingStatus.FAILED && !isDispatched.current[_txId]) {
      isDispatched.current[_txId] = true

      toast.show(pendingTx.error, {
        native: false,
        duration: 8_000,
        variant: 'error',
      })
    }
  })
}
