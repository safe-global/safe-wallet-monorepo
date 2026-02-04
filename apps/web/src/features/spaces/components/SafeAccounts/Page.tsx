import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceSafeAccounts from './index'

export default function SpaceSafeAccountsPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source="spaceOnly">
        <SpaceSafeAccounts />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
