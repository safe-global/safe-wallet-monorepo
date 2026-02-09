import { Alert, AlertTitle, Button, Typography, Box } from '@mui/material'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'

/**
 * Prompt displayed when user is not connected to a wallet
 * Guides them to connect to see their Safes
 */
const ConnectWalletPrompt = () => {
  const connectWallet = useConnectWallet()

  return (
    <Alert severity="info" icon={<AccountBalanceWalletIcon />} data-testid="connect-wallet-prompt" sx={{ mb: 2 }}>
      <AlertTitle>Connect your wallet</AlertTitle>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Connect your wallet to view and manage your Safe Accounts.
      </Typography>
      <Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AccountBalanceWalletIcon />}
          onClick={connectWallet}
          data-testid="connect-wallet-button"
        >
          Connect wallet
        </Button>
      </Box>
    </Alert>
  )
}

export default ConnectWalletPrompt
