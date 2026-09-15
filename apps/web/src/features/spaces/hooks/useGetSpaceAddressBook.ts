import { useMemo } from 'react'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import {
  useAddressBooksGetAddressBookItemsV1Query,
  type SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import useChains from '@/hooks/useChains'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'

const EMPTY_ADDRESS_BOOK: SpaceAddressBookItemDto[] = []

const useGetSpaceAddressBook = (): SpaceAddressBookItemDto[] => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { configs: chains } = useChains()
  const { currentData: addressBook } = useAddressBooksGetAddressBookItemsV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )

  // Workspace contacts apply to every network; the stored save-time snapshot only serves while the chain config is unavailable
  return useMemo(() => {
    if (!addressBook) return EMPTY_ADDRESS_BOOK
    if (chains.length === 0) return addressBook.data
    const chainIds = chains.map((chain) => chain.chainId)
    return addressBook.data.map((item) => ({ ...item, chainIds }))
  }, [addressBook, chains])
}

export default useGetSpaceAddressBook
