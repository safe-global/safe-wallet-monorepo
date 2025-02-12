import { Typography, Paper, Box, Button } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const MembersList = () => {
  const handleInviteClick = () => {
    // TODO: Implement invite functionality
    console.log('Invite clicked')
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* TODO: remove this circular image placeholder */}
      <Box
        sx={{
          width: 40,
          height: 40,
          backgroundColor: 'grey.200',
          borderRadius: '50%',
          m: 1,
        }}
      />
      <Button
        onClick={handleInviteClick}
        sx={{
          width: '100%',
          p: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
        }}
        aria-label="Invite team members"
      >
        <Box>
          <Typography variant="body1" color="text.primary" fontWeight={700}>
            Invite team members
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Text description
          </Typography>
        </Box>
        <ChevronRightIcon color="action" />
      </Button>
    </Paper>
  )
}

export default MembersList
