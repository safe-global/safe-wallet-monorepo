import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceSafeAccounts from './index'

const ADDRESS_BOOK_SOURCE = 'spaceOnly'

export default function SpaceSafeAccountsPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source={ADDRESS_BOOK_SOURCE}>
        <SpaceSafeAccounts />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
