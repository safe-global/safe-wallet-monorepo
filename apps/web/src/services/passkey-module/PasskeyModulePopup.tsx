import { type FormEvent, useState } from 'react'
import { Alert, Box, Button, TextField, Typography } from '@mui/material'
import { deriveIdentityAddress, type PasskeyMetadata } from '@safe-global/utils/services/passkey'
import { getAddress } from 'ethers'
import { useCurrentChain } from '@/hooks/useChains'
import { getRpcServiceUrl } from '@/hooks/wallets/web3'
import ModalDialog from '@/components/common/ModalDialog'
import passkeyPopupStore, { webPasskeyStorage } from './passkey-store'

const { useStore, setStore } = passkeyPopupStore

const PasskeyModulePopup = () => {
  const store = useStore()
  const isOpen = store?.isOpen ?? false
  const chain = useCurrentChain()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onClose = () => {
    setStore({ isOpen: false, data: null })
    setError('')
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!chain) throw new Error('No active chain')
      const form = e.target as HTMLFormElement
      const rawId = (form.elements.namedItem('rawId') as HTMLInputElement).value.trim()
      const x = (form.elements.namedItem('x') as HTMLInputElement).value.trim()
      const y = (form.elements.namedItem('y') as HTMLInputElement).value.trim()
      if (!rawId || !x || !y) throw new Error('All fields are required')

      const rpcUrl = getRpcServiceUrl(chain.rpcUri)
      const rawIdentity = await deriveIdentityAddress({
        rpcUrl,
        chainId: chain.chainId,
        coordinates: { x, y },
      })
      const identityContractAddress = getAddress(rawIdentity)

      const metadata: PasskeyMetadata = {
        rawId,
        coordinates: { x, y },
        identityContractAddresses: { [chain.chainId]: identityContractAddress },
        deployedOnChains: [],
      }
      await webPasskeyStorage.add(metadata)
      setStore({ isOpen: false, data: metadata })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to derive identity address')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalDialog dialogTitle="Connect with Passkey" onClose={onClose} open={isOpen} sx={{ zIndex: 1400 }}>
      <Box p={2}>
        <Typography variant="body1" gutterBottom mb={2}>
          Enter your passkey credentials from the mobile app.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={onSubmit} action="#" method="post">
          <TextField label="Raw ID" fullWidth required name="rawId" sx={{ mb: 2 }} placeholder="Base64 credential ID" />
          <TextField label="Public Key X" fullWidth required name="x" sx={{ mb: 2 }} placeholder="0x..." />
          <TextField label="Public Key Y" fullWidth required name="y" sx={{ mb: 3 }} placeholder="0x..." />

          <Button variant="contained" color="primary" fullWidth type="submit" disabled={loading}>
            {loading ? 'Deriving address...' : 'Connect'}
          </Button>
        </form>
      </Box>
    </ModalDialog>
  )
}

export default PasskeyModulePopup
