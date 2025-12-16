import { Close } from '@mui/icons-material'
import { Dialog, DialogContent, IconButton, Box, useMediaQuery } from '@mui/material'
import { type ReactNode } from 'react'

export type HnModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

const HnModal = ({ open, onClose, children }: HnModalProps) => {
  const isSmallScreen = useMediaQuery('(max-width:700px)')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: '16px',
          backgroundColor: 'var(--color-background-paper)',
          backgroundImage: 'none',
        },
      }}
    >
      <Box
        position="absolute"
        top={16}
        zIndex={1}
        sx={{
          ...(isSmallScreen ? { left: 16 } : { right: 16 }),
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            ...(isSmallScreen
              ? { color: 'var(--color-static-text-secondary)' }
              : { color: 'var(--color-static-primary)' }),
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
