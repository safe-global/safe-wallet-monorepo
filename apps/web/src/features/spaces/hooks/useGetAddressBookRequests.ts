import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useAddressBooksGetRequestsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const useGetAddressBookRequests = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: requests } = useAddressBooksGetRequestsV1Query(
    { spaceId: Number(spaceId) },
    { skip: !isUserSignedIn || !spaceId },
  )

  return requests?.data || []
}

export default useGetAddressBookRequests
