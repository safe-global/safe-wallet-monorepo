import { useMemo } from 'react'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import {
  useUserAddressBookGetPrivateItemsV1Query,
  type SpaceAddressBookItemDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const useGetPrivateAddressBook = (): SpaceAddressBookItemDto[] => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: addressBook } = useUserAddressBookGetPrivateItemsV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId },
  )

  return useMemo(
    () =>
      (addressBook?.data ?? []).map((item) => ({
        name: item.name,
        address: item.address,
        chainIds: item.chainIds,
        createdBy: item.createdBy,
        createdByUserId: 0,
        lastUpdatedBy: item.createdBy,
        lastUpdatedByUserId: 0,
        createdAt: String(item.createdAt),
        updatedAt: String(item.updatedAt),
      })),
    [addressBook],
  )
}

export default useGetPrivateAddressBook
