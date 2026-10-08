import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SecurityHub from './index'

const ADDRESS_BOOK_SOURCE = 'spaceOnly'

export default function SecurityHubPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source={ADDRESS_BOOK_SOURCE}>
        <SecurityHub />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
