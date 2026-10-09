import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import {
  useAddressBookRequestsGetPendingRequestsV1Query,
  type AddressBookRequestItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const EMPTY_REQUESTS: AddressBookRequestItemDto[] = []

/** Pending contact requests with their query state, so an empty list is distinguishable from an unread one. */
export const useAddressBookRequestsState = (): {
  items: AddressBookRequestItemDto[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
} => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const {
    currentData: requests,
    isLoading,
    isError,
    refetch,
  } = useAddressBookRequestsGetPendingRequestsV1Query({ spaceId: spaceId ?? '' }, { skip: !isUserSignedIn || !spaceId })

  return { items: requests?.data ?? EMPTY_REQUESTS, isLoading, isError, refetch }
}

const useGetAddressBookRequests = (): AddressBookRequestItemDto[] => useAddressBookRequestsState().items

export default useGetAddressBookRequests
