import { Paper, Button, Box } from '@mui/material'
import type { UserOrganization } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import PlusIcon from '@/public/images/common/plus.svg'
import { useState } from 'react'
import AddMembersModal from '../AddMembersModal'
import MemberName from '../MembersList/MemberName'

const DashboardMembersList = ({ members, displayLimit }: { members: UserOrganization[]; displayLimit: number }) => {
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)
  const membersToDisplay = members.slice(0, displayLimit)

  return (
    <>
      <Paper sx={{ p: 2, borderRadius: '8px' }}>
        {membersToDisplay.map((member) => (
          <Box mb={2} key={member.id}>
            <MemberName key={member.id} member={member} />
          </Box>
        ))}
        <Box display="flex" justifyContent="center">
          <Button size="small" variant="text" startIcon={<PlusIcon />} onClick={() => setOpenAddMembersModal(true)}>
            Add member
          </Button>
        </Box>
      </Paper>
      {openAddMembersModal && <AddMembersModal onClose={() => setOpenAddMembersModal(false)} />}
    </>
  )
}

export default DashboardMembersList
