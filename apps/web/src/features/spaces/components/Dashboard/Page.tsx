import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceDashboard from './index'

const ADDRESS_BOOK_SOURCE = 'merged'

export default function SpaceDashboardPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source={ADDRESS_BOOK_SOURCE}>
        <SpaceDashboard />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
