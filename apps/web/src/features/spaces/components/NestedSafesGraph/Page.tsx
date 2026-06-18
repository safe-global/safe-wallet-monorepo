import AuthState from '../AuthState'
import NestedSafesGraph from './index'

export default function NestedSafesGraphPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <NestedSafesGraph />
    </AuthState>
  )
}
