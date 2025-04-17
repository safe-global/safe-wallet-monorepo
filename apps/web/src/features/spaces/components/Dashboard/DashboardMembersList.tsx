import { Button, Box, Stack } from '@mui/material'
import type { Member } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import PlusIcon from '@/public/images/common/plus.svg'
import { useState } from 'react'
import AddMemberModal from '../AddMemberModal'
import MemberName from '../MembersList/MemberName'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'

const DashboardMembersList = ({ members }: { members: Member[] }) => {
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)
  const isAdmin = useIsAdmin()

  return (
    <>
      <Stack spacing={2}>
        {members.map((member) => (
          <Box key={member.id}>
            <MemberName key={member.id} member={member} />
          </Box>
        ))}
      </Stack>
      {isAdmin && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Track {...SPACE_EVENTS.ADD_MEMBER_MODAL} label={SPACE_LABELS.space_dashboard}>
            <Button size="small" variant="text" startIcon={<PlusIcon />} onClick={() => setOpenAddMembersModal(true)}>
              Add member
            </Button>
          </Track>
        </Box>
      )}
      {openAddMembersModal && <AddMemberModal onClose={() => setOpenAddMembersModal(false)} />}
    </>
  )
}

export default DashboardMembersList
