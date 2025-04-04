import { Button, InputAdornment, Stack, SvgIcon, TextField, Typography } from '@mui/material'
import SearchIcon from '@/public/images/common/search.svg'
import { useIsInvited, useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import PlusIcon from '@/public/images/common/plus.svg'

const SpaceAddressBook = () => {
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()

  const handleSearch = (value: string) => {
    // TODO: implement search
    console.log(value)
  }

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
            <Button variant="contained" startIcon={<PlusIcon />} onClick={() => {}}>
              Add contact
            </Button>
          </Track>
        )}
      </Stack>
    </>
  )
}

export default SpaceAddressBook
