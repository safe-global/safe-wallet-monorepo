import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import {
  useAddressBooksGetAddressBookItemsV1Query,
  type SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'

const EMPTY_ADDRESS_BOOK: SpaceAddressBookItemDto[] = []

/** The workspace address book, with its query state, so an empty book is distinguishable from an unread one. */
export const useSpaceAddressBookState = (): {
  items: SpaceAddressBookItemDto[]
  isLoading: boolean
  isError: boolean
} => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const {
    currentData: addressBook,
    isLoading,
    isError,
  } = useAddressBooksGetAddressBookItemsV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )

  return { items: addressBook?.data ?? EMPTY_ADDRESS_BOOK, isLoading, isError }
}

const useGetSpaceAddressBook = (): SpaceAddressBookItemDto[] => useSpaceAddressBookState().items

export default useGetSpaceAddressBook
