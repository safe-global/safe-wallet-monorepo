import type { ReactElement } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'

import AddressBookSearchInput from '@/components/common/AddressBookSearchInput'
import Track from '@/components/common/Track'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Link as ShadcnLink } from '@/components/ui/link'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import { ModalType } from '../AddressBookTable'
import { useAppSelector } from '@/store'
import { type AddressBookState, selectAllAddressBooks } from '@/store/addressBookSlice'
import ImportIcon from '@/public/images/common/import.svg'
import ExportIcon from '@/public/images/common/export.svg'
import mapProps from '@/utils/mad-props'
import { AppRoutes } from '@/config/routes'
import { useCurrentSpaceId, useIsAdmin, useIsQualifiedSafe } from '@/features/spaces'
import { isAuthenticated } from '@/store/authSlice'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const SpaceAddressBookCTA = () => {
  const isQualifiedSafe = useIsQualifiedSafe()
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !isUserSignedIn || !spaceId })

  if (!isQualifiedSafe || !isAdmin) return null

  return (
    <Typography className="max-w-[500px] text-sm">
      This data is stored in your local storage. Do you want to manage your <b>{space?.name}</b> workspace address book
      instead?{' '}
      <ShadcnLink render={<Link href={{ pathname: AppRoutes.spaces.addressBook, query: { spaceId } }} passHref />}>
        Click here
      </ShadcnLink>
    </Typography>
  )
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
  const canExport = Object.values(allAddressBooks).some((addressBook) => Object.keys(addressBook || {}).length > 0)

  return (
    <div className="mb-6 flex flex-col gap-6 px-4">
      <Typography variant="h2" className="font-bold leading-none tracking-tight">
        Address book
      </Typography>

      <SpaceAddressBookCTA />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
        <div className="flex shrink-0 flex-wrap gap-2">
          <Track {...ADDRESS_BOOK_EVENTS.CREATE_ENTRY}>
            <Button size="lg" className="px-4 py-0" onClick={handleOpenModal(ModalType.ENTRY)}>
              <Plus className="mr-1 size-4 text-green-500" />
              New entry
            </Button>
          </Track>

          <Track {...ADDRESS_BOOK_EVENTS.IMPORT_BUTTON}>
            <Button variant="outline" size="lg" className="px-4 py-0" onClick={handleOpenModal(ModalType.IMPORT)}>
              <ImportIcon className="size-4" />
              Import
            </Button>
          </Track>

          <Track {...ADDRESS_BOOK_EVENTS.DOWNLOAD_BUTTON}>
            <Button
              variant="outline"
              size="lg"
              className="px-4 py-0"
              onClick={handleOpenModal(ModalType.EXPORT)}
              disabled={!canExport}
            >
              <ExportIcon className="size-4" />
              Export
            </Button>
          </Track>
        </div>

        {hasEntries && (
          <AddressBookSearchInput
            value={searchQuery}
            onChange={onSearchQueryChange}
            placeholder="Search for contacts"
          />
        )}
      </div>
    </div>
  )
}

const useAllAddressBooks = () => useAppSelector(selectAllAddressBooks)

export default mapProps(AddressBookHeader, {
  allAddressBooks: useAllAddressBooks,
})
