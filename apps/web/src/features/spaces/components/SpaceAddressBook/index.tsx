import { Stack, Typography } from '@mui/material'
import { useIsInvited, useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import AddContact from './AddContact'
import EmptyAddressBook from '@/features/spaces/components/SpaceAddressBook/EmptyAddressBook'
import SpaceAddressBookTable from './SpaceAddressBookTable'
import ImportAddressBook from '@/features/spaces/components/SpaceAddressBook/Import'
import SearchInput from '@/features/spaces/components/SearchInput'
import useAddressBookSearch from '@/features/spaces/hooks/useAddressBookSearch'
import { useState } from 'react'
import useGetSpaceAddressBook from '@/features/spaces/hooks/useGetSpaceAddressBook'

const SpaceAddressBook = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()
  const addressBookItems = useGetSpaceAddressBook()

  const filteredAddressBook = useAddressBookSearch(addressBookItems, searchQuery)

  return (
    <>
      {isInvited && <PreviewInvite />}
      <Typography variant="h1" mb={3}>
        Address book
      </Typography>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={3}
        flexWrap="wrap"
        gap={2}
        flexDirection={{ xs: 'column-reverse', md: 'row' }}
      >
        <SearchInput onSearch={setSearchQuery} />

        {isAdmin && (
          <Stack direction="row" gap={1}>
            <ImportAddressBook />
            <Track {...SPACE_EVENTS.ADD_ADDRESS}>
              <AddContact />
            </Track>
          </Stack>
        )}
      </Stack>

      {searchQuery && !filteredAddressBook.length && (
        <Typography variant="h5" fontWeight="normal" mb={2} color="primary.light">
          Found 0 results
        </Typography>
      )}

      {addressBookItems.length === 0 ? (
        <EmptyAddressBook />
      ) : (
        filteredAddressBook.length > 0 && <SpaceAddressBookTable entries={filteredAddressBook} />
      )}
    </>
  )
}

export default SpaceAddressBook
