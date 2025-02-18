import EmptyMembers from '@/features/organizations/components/MembersList/EmptyMembers'
import PlusIcon from '@/public/images/common/plus.svg'
import { Button, Stack, Typography } from '@mui/material'
import AddMembersModal from '@/features/organizations/components/AddMembersModal'
import { useState } from 'react'

const OrganizationMembers = () => {
  const members = [] // TODO: Fetch from backend
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)
  // TODO: Render members list
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h1" fontWeight={700}>
          Members
        </Typography>
        <Button size="small" variant="contained" startIcon={<PlusIcon />} onClick={() => setOpenAddMembersModal(true)}>
          Add member
        </Button>
      </Stack>
      {members.length === 0 ? <EmptyMembers /> : <></>}
      {openAddMembersModal && <AddMembersModal onClose={() => setOpenAddMembersModal(false)} />}
    </>
  )
}

export default OrganizationMembers
