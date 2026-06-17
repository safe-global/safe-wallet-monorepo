import AuthState from '../AuthState'
import { BillingDataProvider } from './BillingDataContext'
import Billing from './index'

export default function SpaceBillingPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <BillingDataProvider>
        <Billing />
      </BillingDataProvider>
    </AuthState>
  )
}
