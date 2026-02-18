import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import useWallet from '@/hooks/wallets/useWallet'
import { Box, Button, Typography } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'
import WalletIcon from '@/components/common/WalletIcon'

const WalletLogin = ({
  onLogin,
  onContinue,
  buttonText,
  fullWidth,
}: {
  onLogin: () => void
  onContinue: () => void
  buttonText?: string
  fullWidth?: boolean
}) => {
  const wallet = useWallet()
  const connectWallet = useConnectWallet()

  const onConnectWallet = () => {
    connectWallet()
    onLogin()
  }

  if (wallet !== null) {
    return (
      <Button
        variant="contained"
        size="xlarge"
        onClick={onContinue}
        fullWidth={fullWidth}
        style={{ color: '#fff', background: '#121312' }}
        data-testid="continue-with-wallet-btn"
      >
        <Box justifyContent="space-between" display="flex" flexDirection="row" alignItems="center" gap={1}>
          <Box display="flex" flexDirection="column" alignItems="flex-start">
            <Typography variant="subtitle2" fontWeight={700}>
              {buttonText || 'Continue with'} {wallet.label}
            </Typography>
            {wallet.address && (
              <EthHashInfo address={wallet.address} shortAddress avatarSize={16} showName={false} copyAddress={false} />
            )}
          </Box>
          {wallet.icon && <WalletIcon icon={wallet.icon} provider={wallet.label} width={24} height={24} />}
        </Box>
      </Button>
    )
  }

  return (
    <Button
      onClick={onConnectWallet}
      style={{ color: '#fff', background: '#121312' }}
      sx={{ minHeight: '42px' }}
      variant="contained"
      size="small"
      disableElevation
      fullWidth={fullWidth}
      data-testid="connect-wallet-btn"
    >
      Connect wallet
    </Button>
  )
}

export default WalletLogin
