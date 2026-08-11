import AuthState from '../AuthState'
import { BillingDataProvider } from './BillingDataContext'
import { createPaidBillingState } from './mocks'
import type { UsageStatus } from './types'
import Billing from './index'

// Switch to handle the page status ('within_limit' | 'approaching_limit' | 'limit_reached' | 'payment_failed' | null). Delete when the endpoint is wired.
const DEV_PREVIEW_STATUS: UsageStatus | null = null

export default function SpaceBillingPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <BillingDataProvider value={DEV_PREVIEW_STATUS ? createPaidBillingState(DEV_PREVIEW_STATUS) : undefined}>
        <Billing />
      </BillingDataProvider>
    </AuthState>
  )
}
