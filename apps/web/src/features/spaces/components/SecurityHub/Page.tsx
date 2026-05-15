import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SecurityHub from './index'

export default function SecurityHubPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source="spaceOnly">
        <SecurityHub />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
