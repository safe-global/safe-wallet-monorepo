import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceAddressBook from './index'

const ADDRESS_BOOK_SOURCE = 'spaceOnly'

export default function SpaceAddressBookPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source={ADDRESS_BOOK_SOURCE}>
        <SpaceAddressBook />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
