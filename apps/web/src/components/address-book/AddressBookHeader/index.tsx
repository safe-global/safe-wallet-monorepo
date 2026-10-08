import type { ReactElement } from 'react'

import { ModalType } from '../AddressBookTable'
import { useAppSelector } from '@/store'
import { type AddressBookState, selectAllAddressBooks } from '@/store/addressBookSlice'
import mapProps from '@/utils/mad-props'
import { AppRoutes } from '@/config/routes'
import { useCurrentSpaceId, useIsAdmin, useIsQualifiedSafe } from '@/features/spaces'
import { isAuthenticated } from '@/store/authSlice'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  AddressBookHeaderView,
  type SpaceAddressBookCta,
} from '@views/components/address-book/AddressBookHeader/AddressBookHeaderView'

const useSpaceAddressBookCta = (): SpaceAddressBookCta | undefined => {
  const isQualifiedSafe = useIsQualifiedSafe()
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !isUserSignedIn || !spaceId })

  if (!isQualifiedSafe || !isAdmin) return undefined

  return { spaceName: space?.name, href: { pathname: AppRoutes.spaces.addressBook, query: { spaceId } } }
}

type Props = {
  allAddressBooks: AddressBookState
  handleOpenModal: (type: ModalType) => () => void
  searchQuery: string
  onSearchQueryChange: (searchQuery: string) => void
  hasEntries: boolean
}

function AddressBookHeader({
  allAddressBooks,
  handleOpenModal,
  searchQuery,
  onSearchQueryChange,
  hasEntries,
}: Props): ReactElement {
  const spaceCta = useSpaceAddressBookCta()
  const canExport = Object.values(allAddressBooks).some((addressBook) => Object.keys(addressBook || {}).length > 0)

  return (
    <AddressBookHeaderView
      spaceCta={spaceCta}
      canExport={canExport}
      hasEntries={hasEntries}
      searchQuery={searchQuery}
      onSearchQueryChange={onSearchQueryChange}
      onNewEntry={handleOpenModal(ModalType.ENTRY)}
      onImport={handleOpenModal(ModalType.IMPORT)}
      onExport={handleOpenModal(ModalType.EXPORT)}
    />
  )
}

const useAllAddressBooks = () => useAppSelector(selectAllAddressBooks)

export default mapProps(AddressBookHeader, {
  allAddressBooks: useAllAddressBooks,
})
