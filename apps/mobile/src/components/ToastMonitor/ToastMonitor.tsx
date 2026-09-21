import { useEffect } from 'react'
import { useToastController } from '@tamagui/toast'
import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import { selectToastQueue, dismissToast } from '@/src/store/toastSlice'

/**
 * Global monitor that surfaces queued toasts. Any listener, thunk or plain code can request a
 * toast via dispatch(showToast(...)) without React/Tamagui coupling; this reads the queue,
 * shows each entry, and dismisses it. Mirrors SigningMonitor / ExecutingMonitor, but for
 * ephemeral notifications (no durable domain state, so no pathname guard).
 */
export function ToastMonitor() {
  const queue = useAppSelector(selectToastQueue)
  const toast = useToastController()
  const dispatch = useAppDispatch()

  useEffect(() => {
    queue.forEach(({ id, message, duration, variant }) => {
      toast.show(message, { native: false, duration, variant })
      dispatch(dismissToast(id))
    })
  }, [queue, toast, dispatch])

  return null
}
