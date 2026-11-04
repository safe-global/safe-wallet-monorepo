import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import {
  useAddressBookRequestsGetPendingRequestsV1Query,
  type AddressBookRequestItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'

const EMPTY_REQUESTS: AddressBookRequestItemDto[] = []

/** Pending contact requests plus the query state, so callers can tell "no requests" from "not loaded". */
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
  } = useAddressBookRequestsGetPendingRequestsV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )

  return { items: requests?.data ?? EMPTY_REQUESTS, isLoading, isError, refetch }
}

const useGetAddressBookRequests = (): AddressBookRequestItemDto[] => useAddressBookRequestsState().items

export default useGetAddressBookRequests
