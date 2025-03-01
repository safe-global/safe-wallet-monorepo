import css from '@/features/organizations/components/Dashboard/styles.module.css'
import MemberIcon from '@/public/images/orgs/member.svg'
import { Typography, Paper, Box, Button, SvgIcon } from '@mui/material'

const MembersCard = () => {
  const handleInviteClick = () => {
    // TODO: Implement invite functionality
    console.log('Invite clicked')
  }

  return (
    <Paper sx={{ p: 3, borderRadius: '12px' }}>
      <Box position="relative" width={1}>
        <Box className={css.iconBG}>
          <SvgIcon component={MemberIcon} inheritViewBox />
        </Box>

        <Button
          onClick={handleInviteClick}
          variant="outlined"
          size="compact"
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
          }}
          aria-label="Invite team members"
        >
          Add members
        </Button>
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
  )
}

export default MembersCard
