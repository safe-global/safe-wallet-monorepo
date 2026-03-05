import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceAddressBook from './index'

export default function SpaceAddressBookPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source="spaceOnly">
        <SpaceAddressBook />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
