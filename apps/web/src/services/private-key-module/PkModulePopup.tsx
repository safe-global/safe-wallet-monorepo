import type { FormEvent } from 'react'
import { Button, TextField, Typography, Box } from '@mui/material'
import ModalDialog from '@/components/common/ModalDialog'
import pkStore from './pk-popup-store'
const { useStore, setStore } = pkStore

const PkModulePopup = () => {
  const { isOpen, privateKey } = useStore() ?? { isOpen: false, privateKey: '' }

  const onClose = () => {
    setStore({ isOpen: false, privateKey })
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const privateKey = (e.target as unknown as { 'private-key': HTMLInputElement })['private-key'].value

    setStore({
      isOpen: false,
      privateKey,
    })
  }

  return (
    <ModalDialog dialogTitle="Connect with Private Key" onClose={onClose} open={isOpen} sx={{ zIndex: 1451 }}>
      <Box p={2}>
        <Typography variant="body1" gutterBottom mb={3}>
          Enter your signer private key. The key will be saved for the duration of this browser session.
        </Typography>

        <form onSubmit={onSubmit} action="#" method="post">
          <TextField
            type="password"
            label="Private key"
            fullWidth
            required
            name="private-key"
            sx={{ mb: 3 }}
            data-testid="private-key-input"
          />

          <Button data-testid="pk-connect-btn" variant="contained" color="primary" fullWidth type="submit">
            Connect
          </Button>
        </form>
      </Box>
    </ModalDialog>
  )
}

export default PkModulePopup
