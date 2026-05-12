import AuthState from '../AuthState'
import SpacePolicies from './index'

export default function SpacePoliciesPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <SpacePolicies />
    </AuthState>
  )
}
