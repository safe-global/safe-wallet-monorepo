import AuthState from '../AuthState'
import Billing from './index'

export default function SpaceBillingPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <Billing />
    </AuthState>
  )
}
