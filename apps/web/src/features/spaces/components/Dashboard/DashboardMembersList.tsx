import { Paper, Button, Box } from '@mui/material'
import type { UserOrganization } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import PlusIcon from '@/public/images/common/plus.svg'
import { useState } from 'react'
import AddMembersModal from '../AddMembersModal'
import MemberName from '../MembersList/MemberName'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'

const DashboardMembersList = ({ members }: { members: UserOrganization[] }) => {
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)

  return (
    <>
      <Paper sx={{ p: 2, borderRadius: '8px' }}>
        {members.map((member) => (
          <Box mb={2} key={member.id}>
            <MemberName key={member.id} member={member} />
          </Box>
        ))}
        <Box display="flex" justifyContent="center">
          <Track {...SPACE_EVENTS.ADD_MEMBER_MODAL} label={SPACE_LABELS.space_dashboard}>
            <Button size="small" variant="text" startIcon={<PlusIcon />} onClick={() => setOpenAddMembersModal(true)}>
              Add member
            </Button>
          </Track>
        </Box>
      </Paper>
      {openAddMembersModal && <AddMembersModal onClose={() => setOpenAddMembersModal(false)} />}
    </>
  )
}

export default DashboardMembersList
