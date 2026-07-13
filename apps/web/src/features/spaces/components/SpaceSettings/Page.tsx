import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceSettings from './index'
import { type SettingsPageKey } from './SettingsRail'

export default function SpaceSettingsPage({
  spaceId,
  activePage = 'general',
}: {
  spaceId: string
  activePage?: SettingsPageKey
}) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source="spaceOnly">
        <SpaceSettings activePage={activePage} />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
