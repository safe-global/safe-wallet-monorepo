import { Paper, Stack, Typography, Button, Box } from '@mui/material'
import type { UserOrganization } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { OrgLogo } from '../OrgsCard'
import PlusIcon from '@/public/images/common/plus.svg'
import { useState } from 'react'
import AddMembersModal from '../AddMembersModal'

const DashboardMembersList = ({ members, displayLimit }: { members: UserOrganization[]; displayLimit: number }) => {
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)
  const membersToDisplay = members.slice(0, displayLimit)

  return (
    <>
      <Paper sx={{ p: 2, borderRadius: '8px' }}>
        {membersToDisplay.map((member) => (
          <Stack direction="row" spacing={1} mb={2} alignItems="center" key={member.id}>
            <OrgLogo size="medium" orgName={member.user.id.toString()} rounded />
            <Typography fontSize="14px" key={member.id}>
              User Id: {member.user.id}
            </Typography>
          </Stack>
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
