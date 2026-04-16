import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useAddressBooksGetPrivateItemsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const useGetPrivateAddressBook = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: addressBook } = useAddressBooksGetPrivateItemsV1Query(
    { spaceId: Number(spaceId) },
    { skip: !isUserSignedIn || !spaceId },
  )

  return addressBook?.data || []
}

export default useGetPrivateAddressBook
