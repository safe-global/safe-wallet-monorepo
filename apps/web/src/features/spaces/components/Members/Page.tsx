import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceMembers from './index'

const ADDRESS_BOOK_SOURCE = 'spaceOnly'

export default function SpaceMembersPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source={ADDRESS_BOOK_SOURCE}>
        <SpaceMembers />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
