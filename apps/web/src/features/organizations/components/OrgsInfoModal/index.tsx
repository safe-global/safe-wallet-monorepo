import {
  Button,
  Chip,
  Dialog,
  DialogContent,
  Grid2,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/material'
import CheckIcon from '@/public/images/common/check.svg'
import CloseIcon from '@mui/icons-material/Close'
import CreateOrgInfo from '@/public/images/orgs/create_org_info.png'
import Image from 'next/image'

const ListIcon = () => (
  <ListItemIcon
    sx={{
      alignSelf: 'flex-start',
      minWidth: '20px',
      marginRight: '16px',
      marginTop: '0',
      color: 'success.main',
      '& path:last-child': {
        fill: 'var(--color-success-main)',
      },
      backgroundColor: 'success.light',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <SvgIcon component={CheckIcon} inheritViewBox fontSize="small" sx={{ width: '12px', height: '12px' }} />
  </ListItemIcon>
)

const OrgsInfoModal = ({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) => {
  const handleCreate = () => {
    onClose()
    onCreate()
  }

  return (
    <Dialog open PaperProps={{ style: { width: '870px', maxWidth: '98%', borderRadius: '16px' } }} onClose={onClose}>
      <DialogContent dividers sx={{ p: 0, border: 0 }}>
        <Grid2 container>
          <Grid2 size={6} p={5} display="flex" flexDirection="column">
            <Typography component="div" variant="h1" mb={1} position="relative">
              Introducing organizations
              <Chip
                label="Beta"
                size="small"
                sx={{ ml: 1, fontWeight: 'normal', position: 'absolute', top: '0', right: '0' }}
              />
            </Typography>

            <Typography mt={2} mb={3}>
              Collaborate seamlessly with your team and keep your treasury organized.
            </Typography>

            <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <ListItem disablePadding>
                <ListIcon />
                Bring all your Safe Accounts into one shared space.
              </ListItem>

              <ListItem disablePadding>
                <ListIcon />
                Invite team members with shared access—whether they’re signers or just viewers.
              </ListItem>

              <ListItem disablePadding>
                <ListIcon />
                Everyone sees the same account names, team members, and data.
              </ListItem>

              <ListItem disablePadding>
                <ListIcon />
                Aggregated balances and actions across multiple accounts are coming soon!
              </ListItem>
            </List>

            <Stack gap={2} mt="auto">
              <Button variant="contained" color="primary" onClick={handleCreate}>
                Create an organization
              </Button>

              <Button variant="text" color="primary" onClick={onClose}>
                Maybe later
              </Button>
            </Stack>
          </Grid2>

          <Grid2 size={6} justifyContent="center" flex={1} bgcolor="#121312">
            <Image src={CreateOrgInfo} alt="An illustration of multiple safe accounts" />
          </Grid2>
        </Grid2>

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            p: 1,
            m: 1,
            color: 'background.paper',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogContent>
    </Dialog>
  )
}

export default OrgsInfoModal
