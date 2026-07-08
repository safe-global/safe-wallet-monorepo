import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceMembers from './index'
import { useRetryPendingInvite } from '@/features/spaces/hooks/useRetryPendingInvite'

export default function SpaceMembersPage({ spaceId }: { spaceId: string }) {
  useRetryPendingInvite()

  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source="spaceOnly">
        <SpaceMembers />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
