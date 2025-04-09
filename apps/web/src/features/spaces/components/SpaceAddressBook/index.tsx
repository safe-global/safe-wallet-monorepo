import { InputAdornment, Stack, SvgIcon, TextField, Typography } from '@mui/material'
import SearchIcon from '@/public/images/common/search.svg'
import { useIsInvited, useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import AddContact from './AddContact'
import EmptyAddressBook from '@/features/spaces/components/SpaceAddressBook/EmptyAddressBook'
import SpaceAddressBookTable from './SpaceAddressBookTable'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

const SpaceAddressBook = () => {
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()

  const handleSearch = (value: string) => {
    // TODO: implement search
    console.log(value)
  }

  // TODO: Get data from CGW
  const entries = [
    {
      address: '0xF94c38db9992cfE106C6502bfB6efa58519f7570',
      name: 'John Doe',
      networks: [
        {
          chainId: '11155111',
          chainName: 'Sepolia',
          l2: false,
          nativeCurrency: {
            symbol: 'ETH',
          },
        } as ChainInfo,
        {
          chainId: '137',
          chainName: 'Polygon',
          l2: false,
          nativeCurrency: {
            symbol: 'ETH',
          },
        } as ChainInfo,
        {
          chainId: '17000',
          chainName: 'Holesky',
          l2: false,
          nativeCurrency: {
            symbol: 'ETH',
          },
        } as ChainInfo,
      ],
    },
    {
      address: '0x2c303045f1e716FFe38aEe71A3E834dB23E955Ff',
      name: 'Jane Smith',
      networks: [
        {
          chainId: '1',
          chainName: 'Ethereum',
          l2: false,
          nativeCurrency: {
            symbol: 'ETH',
          },
        } as ChainInfo,
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
          <Track {...SPACE_EVENTS.ADD_ADDRESS}>
            <AddContact />
          </Track>
        )}
      </Stack>

      {entries.length === 0 ? <EmptyAddressBook /> : <SpaceAddressBookTable entries={entries} />}
    </>
  )
}

export default SpaceAddressBook
