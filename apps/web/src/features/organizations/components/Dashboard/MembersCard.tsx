import css from '@/features/organizations/components/Dashboard/styles.module.css'
import MemberIcon from '@/public/images/orgs/member.svg'
import { Typography, Paper, Box, Button, SvgIcon, Tooltip } from '@mui/material'
import { useState } from 'react'
import { useIsAdmin } from '@/features/organizations/hooks/useOrgMembers'
import AddMembersModal from '../AddMembersModal'

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
          <Tooltip title={isButtonDisabled ? 'Only admins can add members' : ''} placement="top">
            <Box component="span" sx={{ position: 'absolute', top: 0, right: 0 }}>
              <Button
                onClick={handleInviteClick}
                variant={isButtonDisabled ? 'contained' : 'outlined'}
                size="compact"
                aria-label="Invite team members"
                disabled={isButtonDisabled}
              >
                Add members
              </Button>
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
      {openAddMembersModal && <AddMembersModal onClose={() => setOpenAddMembersModal(false)} />}
    </>
  )
}

export default MembersCard
