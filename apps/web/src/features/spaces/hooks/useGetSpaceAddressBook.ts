import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import {
  useAddressBooksGetAddressBookItemsV1Query,
  type SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'

// Stable reference: `|| []` would mint a new array per render for every consumer (useAddressBook is
// mounted per address row), invalidating the memo chains built on top of it.
const EMPTY_ADDRESS_BOOK: SpaceAddressBookItemDto[] = []

const useGetSpaceAddressBook = (): SpaceAddressBookItemDto[] => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: addressBook } = useAddressBooksGetAddressBookItemsV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )

  return addressBook?.data ?? EMPTY_ADDRESS_BOOK
}

export default useGetSpaceAddressBook
