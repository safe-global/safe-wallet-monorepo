import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceSettings from './index'

export default function SpaceSettingsPage({ spaceId }: { spaceId: string }) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source="spaceOnly">
        <SpaceSettings />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
