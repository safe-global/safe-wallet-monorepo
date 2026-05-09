import { useEffect } from 'react'
import { usePathname } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import { clearSigning } from '@/src/store/signingStateSlice'

const routerPaths = ['/review-and-confirm', '/ledger-review', '/signing-success', '/signing-error']
/**
 * Global monitor that reacts to signing completions and shows toasts.
 */
export function SigningMonitor() {
  const signings = useAppSelector((state) => state.signingState.signings)
  const pathname = usePathname()
  const toast = useToastController()
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Process each completed signing (status: 'success' or 'error')
    Object.entries(signings).forEach(([txId, signing]) => {
      if (signing.status === 'success' || signing.status === 'error') {
        // Check if the component is handling the feedback (navigation to success/error)
        // If user is on review screen OR already navigated to success/error screen,
        // the component handled it - we just need to clean up
        const isComponentHandlingFeedback = routerPaths.some((path) => pathname.includes(path))

        // Only show toast if component did NOT handle feedback
        // (user navigated somewhere else during signing)
        if (!isComponentHandlingFeedback) {
          if (signing.status === 'success') {
            toast.show('Transaction signed successfully', {
              native: false,
              duration: 5000,
            })
          } else if (signing.status === 'error') {
            toast.show(`Signing failed: ${signing.error || 'Unknown error'}`, {
              native: false,
              duration: 5000,
              variant: 'error',
            })
          }
        }

        // Clear this signing from state (whether we showed toast or not)
        dispatch(clearSigning(txId))
      }
    })
  }, [signings, pathname, toast, dispatch])

  return null
}
