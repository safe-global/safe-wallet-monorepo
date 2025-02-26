import PlusIcon from '@/public/images/common/plus.svg'
import { Button, InputAdornment, Stack, SvgIcon, TextField, Typography } from '@mui/material'
import AddMembersModal from '@/features/organizations/components/AddMembersModal'
import { useState } from 'react'
import MembersList from '../MembersList'
import InvitesList from './InvitesList'
import SearchIcon from '@/public/images/common/search.svg'
import { useMembersSearch } from '../../hooks/useMembersSearch'
import { useOrgMembers } from '../../hooks/useOrgMembers'

const OrganizationMembers = () => {
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { activeMembers, invitedMembers } = useOrgMembers()

  const filteredMembers = useMembersSearch(activeMembers, searchQuery)
  const filteredInvites = useMembersSearch(invitedMembers, searchQuery)

  return (
    <>
      <Typography variant="h1" mb={3}>
        Members
      </Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
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
        <Button variant="contained" startIcon={<PlusIcon />} onClick={() => setOpenAddMembersModal(true)}>
          Add member
        </Button>
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
              Pending Invitations ({filteredInvites.length})
            </Typography>
            <InvitesList invitedMembers={filteredInvites} />
          </>
        )}
        {filteredMembers.length > 0 && (
          <>
            <Typography variant="h5" fontWeight={700} mb={2} mt={1}>
              All Members ({filteredMembers.length})
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
