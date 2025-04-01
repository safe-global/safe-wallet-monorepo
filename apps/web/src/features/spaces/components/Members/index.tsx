import PlusIcon from '@/public/images/common/plus.svg'
import { Button, InputAdornment, Stack, SvgIcon, TextField, Typography } from '@mui/material'
import AddMemberModal from 'src/features/spaces/components/AddMemberModal'
import { useCallback, useEffect, useState } from 'react'
import MembersList from '@/features/spaces/components/MembersList'
import SearchIcon from '@/public/images/common/search.svg'
import { useMembersSearch } from '@/features/spaces/hooks/useMembersSearch'
import { useIsInvited, useSpaceMembersByStatus, useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import { SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { debounce } from 'lodash'
import { trackEvent } from '@/services/analytics'

const SpaceMembers = () => {
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { activeMembers, invitedMembers } = useSpaceMembersByStatus()
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()

  const filteredMembers = useMembersSearch(activeMembers, searchQuery)
  const filteredInvites = useMembersSearch(invitedMembers, searchQuery)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(debounce(setSearchQuery, 300), [])

  useEffect(() => {
    if (searchQuery) {
      trackEvent({ ...SPACE_EVENTS.SEARCH_MEMBERS })
    }
  }, [searchQuery])

  return (
    <>
      {isInvited && <PreviewInvite />}
      <Typography variant="h1" mb={3}>
        Members
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
          <Track {...SPACE_EVENTS.ADD_MEMBER_MODAL} label={SPACE_LABELS.members_page}>
            <Button variant="contained" startIcon={<PlusIcon />} onClick={() => setOpenAddMembersModal(true)}>
              Add member
            </Button>
          </Track>
        )}
      </Stack>
      <>
        {searchQuery && !filteredMembers.length && !filteredInvites.length && (
          <Typography variant="h5" fontWeight="normal" mb={2} color="primary.light">
            Found 0 results
          </Typography>
        )}
        {filteredInvites.length > 0 && (
          <>
            <Typography variant="h5" fontWeight={700} mb={2}>
              Pending invitations ({filteredInvites.length})
            </Typography>
            <MembersList members={filteredInvites} />
          </>
        )}
        {filteredMembers.length > 0 && (
          <>
            <Typography variant="h5" fontWeight={700} mb={2} mt={1}>
              All members ({filteredMembers.length})
            </Typography>
            <MembersList members={filteredMembers} />
          </>
        )}
      </>

      {openAddMembersModal && <AddMemberModal onClose={() => setOpenAddMembersModal(false)} />}
    </>
  )
}

export default SpaceMembers
