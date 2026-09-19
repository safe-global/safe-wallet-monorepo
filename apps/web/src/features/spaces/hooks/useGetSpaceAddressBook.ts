import { useMemo } from 'react'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import {
  useAddressBooksGetAddressBookItemsV1Query,
  type SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAllChainIds } from './useAllChainIds'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'

const EMPTY_ADDRESS_BOOK: SpaceAddressBookItemDto[] = []

const useGetSpaceAddressBook = (): SpaceAddressBookItemDto[] => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const allChainIds = useAllChainIds()
  const { currentData: addressBook } = useAddressBooksGetAddressBookItemsV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )

  // Workspace contacts apply to every network; the stored save-time snapshot only serves while the chain config is unavailable
  return useMemo(() => {
    if (!addressBook) return EMPTY_ADDRESS_BOOK
    if (allChainIds.length === 0) return addressBook.data
    return addressBook.data.map((item) => ({ ...item, chainIds: allChainIds }))
  }, [addressBook, allChainIds])
}

export default useGetSpaceAddressBook
