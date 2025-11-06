import { Close } from '@mui/icons-material'
import { Dialog, DialogContent, IconButton, Box } from '@mui/material'
import { type ReactNode } from 'react'

export type HnModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

const HnModal = ({ open, onClose, children, maxWidth = 'sm' }: HnModalProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
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
      <DialogContent sx={{ padding: 0, overflow: 'hidden' }}>{children}</DialogContent>
    </Dialog>
  )
}

export default HnModal
