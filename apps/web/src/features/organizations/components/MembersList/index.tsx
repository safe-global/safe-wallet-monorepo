import MemberIcon from '@/public/images/orgs/member.svg'
import { Typography, Paper, Box, Button, SvgIcon } from '@mui/material'

const MembersList = () => {
  const handleInviteClick = () => {
    // TODO: Implement invite functionality
    console.log('Invite clicked')
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box position="relative" width={1}>
        <Box
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'background.main',
            borderRadius: '50%',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <SvgIcon gridArea="icon" component={MemberIcon} inheritViewBox />
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

export default MembersList
