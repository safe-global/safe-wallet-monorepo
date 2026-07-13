import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useAddressBooksGetAddressBookItemsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'

const useGetSpaceAddressBook = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: addressBook } = useAddressBooksGetAddressBookItemsV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )

  return addressBook?.data || []
}

export default useGetSpaceAddressBook
