import { Stack, Typography } from '@mui/material'
import { useIsInvited, useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import AddContact from './AddContact'
import EmptyAddressBook from '@/features/spaces/components/SpaceAddressBook/EmptyAddressBook'
import SpaceAddressBookTable from './SpaceAddressBookTable'
import type { SpaceAddressBookEntry } from '../../types'
import ImportAddressBook from '@/features/spaces/components/SpaceAddressBook/Import'
import SearchInput from '@/features/spaces/components/SearchInput'
import useAddressBookSearch from '@/features/spaces/hooks/useAddressBookSearch'
import { useState } from 'react'

const SpaceAddressBook = () => {
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()
  const [searchQuery, setSearchQuery] = useState('')

  // TODO: Get data from CGW
  const entries: SpaceAddressBookEntry[] = [
    {
      address: '0xF94c38db9992cfE106C6502bfB6efa58519f7570',
      name: 'John Doe',
      networks: [
        {
          chainId: '11155111',
          name: 'John Doe',
          id: '123',
        },
        {
          chainId: '137',
          name: 'John Doe',
          id: '123',
        },
        {
          chainId: '17000',
          name: 'John Doe',
          id: '123',
        },
      ],
    },
    {
      address: '0x2c303045f1e716FFe38aEe71A3E834dB23E955Ff',
      name: 'Jane Smith',
      networks: [
        {
          chainId: '1',
          name: 'Jane Smith',
          id: '123',
        },
      ],
    },
  ]

  const filteredAddressBook = useAddressBookSearch(entries, searchQuery)

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

      {entries.length === 0 ? (
        <EmptyAddressBook />
      ) : (
        filteredAddressBook.length > 0 && <SpaceAddressBookTable entries={filteredAddressBook} />
      )}
    </>
  )
}

export default SpaceAddressBook
