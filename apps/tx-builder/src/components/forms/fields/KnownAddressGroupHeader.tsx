import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { HardDrive } from 'lucide-react'

const KnownAddressGroupHeader = ({ count }: { count: number }) => (
  <Box
    data-testid="contact-group-header"
    sx={{
      position: 'sticky',
      // cancels the listbox top padding so the header sticks flush
      top: '-8px',
      zIndex: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      px: 2,
      py: 1,
      color: 'text.secondary',
      backgroundColor: 'background.main',
      borderBottom: '1px solid',
      borderBottomColor: 'border.light',
    }}
  >
    <HardDrive size={14} />

    <Typography variant="caption" fontWeight={700} color="text.primary" noWrap>
      Local contacts
    </Typography>

    <Typography variant="caption" sx={{ ml: 'auto' }}>
      {count}
    </Typography>
  </Box>
)

export default KnownAddressGroupHeader
