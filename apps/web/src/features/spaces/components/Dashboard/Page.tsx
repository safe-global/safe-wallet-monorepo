import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceDashboard from './index'

export default function SpaceDashboardPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source="merged">
        <SpaceDashboard />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
