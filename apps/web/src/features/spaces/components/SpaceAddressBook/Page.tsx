import { FEATURES } from '@safe-global/utils/utils/chains'
import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import { useHasFeature } from '@/hooks/useChains'
import AuthState from '../AuthState'
import SpaceAddressBookV2 from '../SpaceAddressBookV2'
import SpaceAddressBook from './index'

export default function SpaceAddressBookPage({ spaceId }: { spaceId: string }) {
  const isV2Enabled = useHasFeature(FEATURES.WORKSPACES_ADDRESS_BOOK_V2)

  return (
    <AuthState spaceId={spaceId}>
      <AddressBookSourceProvider source="spaceOnly">
        {isV2Enabled ? <SpaceAddressBookV2 /> : <SpaceAddressBook />}
      </AddressBookSourceProvider>
    </AuthState>
  )
}
