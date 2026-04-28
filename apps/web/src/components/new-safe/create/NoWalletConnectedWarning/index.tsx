import { Alert, AlertTitle, Box } from '@mui/material'
import useWallet from '@/hooks/wallets/useWallet'
import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'

const NoWalletConnectedWarning = () => {
  const wallet = useWallet()

  if (wallet) {
    return null
  }

  return (
    <Alert severity="warning" sx={{ mt: 3 }}>
      <AlertTitle sx={{ fontWeight: 700 }}>No wallet connected</AlertTitle>You need to connect a wallet to create a Safe
      account.
      <Box sx={{ mt: 2 }}>
        <ConnectWalletButton fullWidth />
      </Box>
    </Alert>
  )
}

export default NoWalletConnectedWarning
