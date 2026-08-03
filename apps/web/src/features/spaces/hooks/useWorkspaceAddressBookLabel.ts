import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { getWorkspaceAddressBookLabel } from '@/utils/addressBookNotifications'
import { useCurrentSpaceId } from './useCurrentSpaceId'

export const useWorkspaceAddressBookLabel = (): string => {
  const spaceId = useCurrentSpaceId()
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !isSignedIn || !spaceId })

  return getWorkspaceAddressBookLabel(space?.name ?? "this workspace's")
}
