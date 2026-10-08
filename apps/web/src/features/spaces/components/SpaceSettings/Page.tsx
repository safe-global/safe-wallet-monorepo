import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import AuthState from '../AuthState'
import SpaceSettings from './index'
import { type SettingsPageKey } from './SettingsRail'

const ADDRESS_BOOK_SOURCE = 'spaceOnly'

export default function SpaceSettingsPage({
  spaceId,
  activePage = 'general',
}: {
  spaceId: string
  activePage?: SettingsPageKey
}) {
  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source={ADDRESS_BOOK_SOURCE}>
        <SpaceSettings activePage={activePage} />
      </AddressBookSourceProvider>
    </AuthState>
  )
}
