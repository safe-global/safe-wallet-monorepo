import { IS_PRODUCTION } from '@/config/constants'
import AuthState from '../AuthState'
import { BillingDataProvider } from './BillingDataContext'
import { createPaidBillingState } from './mocks'
import type { BillingState, UsageStatus } from './types'
import Billing from './index'

// DEV PREVIEW: set to a status to force that paid-plan header state on the dev server, or `null`
// for normal (Starter) behaviour. Ignored in production. Remove once wired to live data.
// 'within_limit' | 'approaching_limit' | 'limit_reached' | 'payment_failed'
const DEV_PREVIEW_STATUS: UsageStatus | null = 'within_limit'

export default function SpaceBillingPage({ spaceId }: { spaceId: string }) {
  const previewValue: BillingState | undefined =
    !IS_PRODUCTION && DEV_PREVIEW_STATUS ? createPaidBillingState(DEV_PREVIEW_STATUS) : undefined

  return (
    <AuthState spaceId={spaceId}>
      <BillingDataProvider value={previewValue}>
        <Billing />
      </BillingDataProvider>
    </AuthState>
  )
}
