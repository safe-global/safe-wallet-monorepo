import css from '@/features/spaces/components/Dashboard/styles.module.css'
import MemberIcon from '@/public/images/spaces/member.svg'
import { Typography, Paper, Box, Button, SvgIcon, Tooltip } from '@mui/material'
import { useState } from 'react'
import { useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import AddMemberModal from '../AddMemberModal'
import { SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

const MembersCard = () => {
  const [openAddMembersModal, setOpenAddMembersModal] = useState(false)
  const isAdmin = useIsAdmin()
  const isButtonDisabled = !isAdmin

  const handleInviteClick = () => {
    setOpenAddMembersModal(true)
  }

  return (
    <>
      <Paper sx={{ p: 3, borderRadius: '12px' }}>
        <Box position="relative" width={1}>
          <Box className={css.iconBG}>
            <SvgIcon component={MemberIcon} inheritViewBox />
          </Box>
          <Tooltip title={isButtonDisabled ? 'You need to be an Admin to add members' : ''} placement="top">
            <Box component="span" sx={{ position: 'absolute', top: 0, right: 0 }}>
              <Track {...SPACE_EVENTS.ADD_MEMBER_MODAL} label={SPACE_LABELS.space_dashboard_card}>
                <Button
                  onClick={handleInviteClick}
                  variant={isButtonDisabled ? 'contained' : 'outlined'}
                  size="compact"
                  aria-label="Invite team members"
                  disabled={isButtonDisabled}
                >
                  Add members
                </Button>
              </Track>
            </Box>
          </Tooltip>
        </Box>
        <Box>
          <Typography variant="body1" color="text.primary" fontWeight={700} mb={1}>
            Add members
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Invite team members to help manage your Safe Accounts. You can add both Safe Account signers and external
            collaborators.
          </Typography>
        </Box>
      </Paper>
      {openAddMembersModal && <AddMemberModal onClose={() => setOpenAddMembersModal(false)} />}
    </>
  )
}

export default MembersCard
