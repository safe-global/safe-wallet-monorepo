import { useEffect } from 'react'
import { usePathname } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import { clearExecuting } from '@/src/store/executingStateSlice'

const routerPaths = ['/review-and-execute', '/execution-success', '/execution-error', '/ledger-connect']

export function ExecutingMonitor() {
  const executions = useAppSelector((state) => state.executingState.executions)
  const pathname = usePathname()
  const toast = useToastController()
  const dispatch = useAppDispatch()

  useEffect(() => {
    Object.entries(executions).forEach(([txId, execution]) => {
      if (execution.status === 'success' || execution.status === 'error') {
        const isComponentHandlingFeedback = routerPaths.some((path) => pathname.includes(path))

        if (!isComponentHandlingFeedback) {
          if (execution.status === 'success') {
            toast.show('Transaction submitted successfully. Waiting for indexer to pick it up.', {
              native: false,
              duration: 5000,
            })
          } else if (execution.status === 'error') {
            toast.show(`Execution failed: ${execution.error || 'Unknown error'}`, {
              native: false,
              duration: 5000,
              variant: 'error',
            })
          }
        }

        dispatch(clearExecuting(txId))
      }
    })
  }, [executions, pathname, toast, dispatch])

  return null
}
