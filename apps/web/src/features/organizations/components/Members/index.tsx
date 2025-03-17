import PlusIcon from '@/public/images/common/plus.svg'
import { Button, InputAdornment, Stack, SvgIcon, TextField, Typography } from '@mui/material'
import AddMembersModal from '@/features/organizations/components/AddMembersModal'
import { useState } from 'react'
import MembersList from '@/features/organizations/components/MembersList'
import SearchIcon from '@/public/images/common/search.svg'
import { useMembersSearch } from '@/features/organizations/hooks/useMembersSearch'
import { useIsInvited, useOrgMembersByStatus } from '@/features/organizations/hooks/useOrgMembers'
import { useIsAdmin } from '@/features/organizations/hooks/useOrgMembers'
import PreviewInvite from '../InviteBanner/PreviewInvite'

const OrganizationMembers = () => {
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { activeMembers, invitedMembers } = useOrgMembersByStatus()
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()

  const filteredMembers = useMembersSearch(activeMembers, searchQuery)
  const filteredInvites = useMembersSearch(invitedMembers, searchQuery)

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
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
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
          <Button variant="contained" startIcon={<PlusIcon />} onClick={() => setOpenAddMembersModal(true)}>
            Add member
          </Button>
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

      {openAddMembersModal && <AddMembersModal onClose={() => setOpenAddMembersModal(false)} />}
    </>
  )
}

export default OrganizationMembers
