import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useGetAddressBookRequestsQuery } from '@safe-global/store/gateway/privateAddressBookApi'

const useGetAddressBookRequests = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: requests } = useGetAddressBookRequestsQuery(
    { spaceId: Number(spaceId) },
    { skip: !isUserSignedIn || !spaceId },
  )

  return requests?.data || []
}

export default useGetAddressBookRequests
