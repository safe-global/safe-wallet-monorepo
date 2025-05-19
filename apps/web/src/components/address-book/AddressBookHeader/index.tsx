import { Button, SvgIcon, Grid, Box, Typography } from '@mui/material'
import type { ReactElement, ElementType } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@/public/images/common/search.svg'
import TextField from '@mui/material/TextField'

import Track from '@/components/common/Track'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import PageHeader from '@/components/common/PageHeader'
import { ModalType } from '../AddressBookTable'
import { useAppSelector } from '@/store'
import { type AddressBookState, selectAllAddressBooks } from '@/store/addressBookSlice'
import ImportIcon from '@/public/images/common/import.svg'
import ExportIcon from '@/public/images/common/export.svg'
import AddCircleIcon from '@/public/images/common/add-outlined.svg'
import mapProps from '@/utils/mad-props'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import MUILink from '@mui/material/Link'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { isAuthenticated } from '@/store/authSlice'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import useIsQualifiedSafe from '@/features/spaces/hooks/useIsQualifiedSafe'

const HeaderButton = ({
  icon,
  onClick,
  disabled,
  children,
}: {
  icon: ElementType
  onClick: () => void
  disabled?: boolean
  children: string
}): ReactElement => {
  const svg = <SvgIcon component={icon} inheritViewBox fontSize="small" />

  return (
    <Button onClick={onClick} disabled={disabled} variant="text" color="primary" size="small" startIcon={svg}>
      {children}
    </Button>
  )
}

const SpaceAddressBookCTA = () => {
  const isQualifiedSafe = useIsQualifiedSafe()
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn || !spaceId })

  if (!isQualifiedSafe || !isAdmin) return null

  return (
    <Box width={1}>
      <Typography pl={1} mb={2} maxWidth="500px">
        This data is stored in your local storage. Do you want to manage your <b>{space?.name}</b> space address book
        instead?{' '}
        <Link href={{ pathname: AppRoutes.spaces.addressBook, query: { spaceId } }} passHref>
          <MUILink>Click here</MUILink>
        </Link>
      </Typography>
    </Box>
  )
}

type Props = {
  allAddressBooks: AddressBookState
  handleOpenModal: (type: ModalType) => () => void
  searchQuery: string
  onSearchQueryChange: (searchQuery: string) => void
}

function AddressBookHeader({
  allAddressBooks,
  handleOpenModal,
  searchQuery,
  onSearchQueryChange,
}: Props): ReactElement {
  const canExport = Object.values(allAddressBooks).some((addressBook) => Object.keys(addressBook || {}).length > 0)

  return (
    <PageHeader
      title="Address book"
      noBorder
      action={
        <Grid
          container
          spacing={1}
          sx={{
            pb: 1,
          }}
        >
          <SpaceAddressBookCTA />

          <Grid item xs={12} md={5} xl={4.5}>
            <TextField
              placeholder="Search"
              variant="filled"
              hiddenLabel
              value={searchQuery}
              onChange={(e) => {
                onSearchQueryChange(e.target.value)
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SvgIcon component={SearchIcon} inheritViewBox color="border" />
                  </InputAdornment>
                ),
                disableUnderline: true,
              }}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              display: 'flex',
              justifyContent: ['space-between', , 'flex-end'],
              alignItems: 'center',
            }}
          >
            <Track {...ADDRESS_BOOK_EVENTS.IMPORT_BUTTON}>
              <HeaderButton onClick={handleOpenModal(ModalType.IMPORT)} icon={ImportIcon}>
                Import
              </HeaderButton>
            </Track>

            <Track {...ADDRESS_BOOK_EVENTS.DOWNLOAD_BUTTON}>
              <HeaderButton onClick={handleOpenModal(ModalType.EXPORT)} icon={ExportIcon} disabled={!canExport}>
                Export
              </HeaderButton>
            </Track>

            <Track {...ADDRESS_BOOK_EVENTS.CREATE_ENTRY}>
              <HeaderButton onClick={handleOpenModal(ModalType.ENTRY)} icon={AddCircleIcon}>
                Create entry
              </HeaderButton>
            </Track>
          </Grid>
        </Grid>
      }
    />
  )
}

const useAllAddressBooks = () => useAppSelector(selectAllAddressBooks)

export default mapProps(AddressBookHeader, {
  allAddressBooks: useAllAddressBooks,
})
