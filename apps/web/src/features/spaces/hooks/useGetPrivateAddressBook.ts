import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useGetPrivateAddressBookQuery } from '@safe-global/store/gateway/privateAddressBookApi'

const useGetPrivateAddressBook = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: addressBook } = useGetPrivateAddressBookQuery(
    { spaceId: Number(spaceId) },
    { skip: !isUserSignedIn || !spaceId },
  )

  return addressBook?.data || []
}

export default useGetPrivateAddressBook
