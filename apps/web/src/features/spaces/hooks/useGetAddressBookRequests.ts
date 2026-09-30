import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useAddressBookRequestsGetPendingRequestsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const useGetAddressBookRequests = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: requests } = useAddressBookRequestsGetPendingRequestsV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId },
  )

  return requests?.data || []
}

export default useGetAddressBookRequests
