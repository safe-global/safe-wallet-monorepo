import { InputAdornment, Stack, SvgIcon, TextField, Typography } from '@mui/material'
import SearchIcon from '@/public/images/common/search.svg'
import { useIsInvited, useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import AddContact from './AddContact'
import EmptyAddressBook from '@/features/spaces/components/SpaceAddressBook/EmptyAddressBook'
import SpaceAddressBookTable from './SpaceAddressBookTable'
import type { SpaceAddressBookEntry } from '../../types'
import ImportAddressBook from '@/features/spaces/components/SpaceAddressBook/Import'

const SpaceAddressBook = () => {
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()

  const handleSearch = (value: string) => {
    // TODO: implement search
    console.log(value)
  }

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
        <TextField
          placeholder="Search"
          variant="filled"
          hiddenLabel
          onChange={(e) => {
            handleSearch(e.target.value)
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SvgIcon component={SearchIcon} inheritViewBox color="border" fontSize="small" />
              </InputAdornment>
            ),
            disableUnderline: true,
          }}
          size="small"
        />
        {isAdmin && (
          <Stack direction="row" gap={1}>
            <ImportAddressBook />
            <Track {...SPACE_EVENTS.ADD_ADDRESS}>
              <AddContact />
            </Track>
          </Stack>
        )}
      </Stack>

      {entries.length === 0 ? <EmptyAddressBook /> : <SpaceAddressBookTable entries={entries} />}
    </>
  )
}

export default SpaceAddressBook
