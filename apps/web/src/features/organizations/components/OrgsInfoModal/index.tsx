import {
  Button,
  Dialog,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  Stack,
  Typography,
} from '@mui/material'
import CheckIcon from '@/public/images/common/circle-check.svg'
import CloseIcon from '@mui/icons-material/Close'
import NoEntriesIcon from '@/public/images/address-book/no-entries.svg'

const ListIcon = () => (
  <ListItemIcon
    sx={{
      minWidth: '40px',
      color: 'secondary.light',
      '& path:last-child': {
        fill: 'var(--color-success-main)',
      },
    }}
  >
    <CheckIcon />
  </ListItemIcon>
)

const OrgsInfoModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <Dialog open PaperProps={{ style: { width: '800px', maxWidth: '98%' } }} onClose={onClose}>
      <DialogContent dividers sx={{ py: 3, px: 4 }}>
        <Stack direction="row">
          <Stack flex={1}>
            <Typography variant="h2" mb={1}>
              Introducing organizations
            </Typography>

            <Typography mt={2} mb={3}>
              Collaborate efficiently with your team members and simplify treasury management.
            </Typography>

            <List>
              <ListItem>
                <ListIcon />
                Invite anyone into your organization. Even if they are not a signer.
              </ListItem>

              <ListItem>
                <ListIcon />
                Organize your account under one roof.
              </ListItem>

              <ListItem>
                <ListIcon />
                Your data is securely stored in an encrypted database.
              </ListItem>

              <ListItem>
                <ListIcon />
                More features incoming.
              </ListItem>
            </List>

            <Stack gap={2} mt={8}>
              <Button variant="contained" color="primary">
                Create an organization
              </Button>

              <Button variant="text" color="primary">
                Maybe later
              </Button>
            </Stack>
          </Stack>

          <Stack justifyContent="center" flex={1}>
            <NoEntriesIcon width="100%" height="auto" />
          </Stack>
        </Stack>

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            p: 1,
            m: 1,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogContent>
    </Dialog>
  )
}

export default OrgsInfoModal
