import { Close } from '@mui/icons-material'
import { Dialog, DialogContent, IconButton, Box } from '@mui/material'
import { type ReactNode } from 'react'

export type HnModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

const HnModal = ({ open, onClose, children }: HnModalProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      PaperProps={{
        sx: {
          maxWidth: '720px',
          borderRadius: '16px',
          backgroundColor: 'var(--color-background-paper)',
          backgroundImage: 'none',
        },
      }}
    >
      <Box position="absolute" top={16} right={16} zIndex={1}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: 'var(--color-static-primary)',
          }}
        >
          <Close />
        </IconButton>
      </Box>
      <DialogContent sx={{ padding: 0, overflow: 'auto' }}>{children}</DialogContent>
    </Dialog>
  )
}

export default HnModal
