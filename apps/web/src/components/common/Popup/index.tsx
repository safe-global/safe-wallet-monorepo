import { Paper, Popover } from '@mui/material'
import type { PopoverProps } from '@mui/material'
import type { ReactElement } from 'react'

const Popup = ({ children, ...props }: PopoverProps): ReactElement => {
  return (
    <Popover
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      sx={{
        // Sit just below the anchoring header icon with a small gap (matching the account menu
        // popover), rather than pinning to a fixed header height that no longer matches the header.
        // 24px radius matches the notifications popover.
        '& > .MuiPaper-root': {
          marginTop: '12px',
          overflowY: 'auto',
          borderRadius: '24px',
        },
      }}
      {...props}
    >
      <Paper sx={{ p: 4, width: '454px', borderRadius: '24px' }}>{children}</Paper>
    </Popover>
  )
}

export default Popup
