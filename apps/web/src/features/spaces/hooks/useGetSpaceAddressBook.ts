import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useAddressBooksGetAddressBookItemsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const useGetSpaceAddressBook = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: addressBook } = useAddressBooksGetAddressBookItemsV1Query(
    { spaceId: Number(spaceId) },
    { skip: !isUserSignedIn },
  )

  return addressBook?.data || []
}

export default useGetSpaceAddressBook
