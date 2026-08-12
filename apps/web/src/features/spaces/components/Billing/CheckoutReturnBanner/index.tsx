import { type ReactElement } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import type { CheckoutReturnStatus } from '@/features/spaces'

const CheckoutReturnBanner = ({ status }: { status: CheckoutReturnStatus }): ReactElement | null => {
  switch (status) {
    case 'processing':
      return (
        <Alert severity="info" icon={<CircularProgress size={20} />} data-testid="billing-checkout-processing">
          Processing your payment… This may take a few moments.
        </Alert>
      )
    case 'activating':
      return (
        <Alert severity="info" icon={<CircularProgress size={20} />} data-testid="billing-checkout-activating">
          Payment successful! Activating your plan…
        </Alert>
      )
    case 'timeout':
      return (
        <Alert severity="warning" data-testid="billing-checkout-timeout">
          Your payment went through but activation is taking longer than expected. Your plan will appear here shortly.
        </Alert>
      )
    case 'error':
      return (
        <Alert severity="error" data-testid="billing-checkout-error">
          We couldn&apos;t confirm your checkout session. If you completed the payment, your plan will appear shortly.
        </Alert>
      )
    case 'complete':
      return (
        <Alert severity="success" data-testid="billing-checkout-complete">
          Your plan is active. Welcome aboard!
        </Alert>
      )
    default:
      return null
  }
}

export default CheckoutReturnBanner
