import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import useWallet from '@/hooks/wallets/useWallet'
import { Box, Button, Typography } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'
import WalletIcon from '@/components/common/WalletIcon'

const WalletLogin = ({
  onLogin,
  onContinue,
  buttonText,
}: {
  onLogin: () => void
  onContinue: () => void
  buttonText?: string
}) => {
  const wallet = useWallet()
  const connectWallet = useConnectWallet()

  const onConnectWallet = () => {
    connectWallet()
    onLogin()
  }

  if (wallet !== null) {
    return (
      <Button variant="contained" sx={{ padding: '8px 16px' }} onClick={onContinue}>
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
    <Button onClick={onConnectWallet} sx={{ minHeight: '42px' }} variant="contained" size="small" disableElevation>
      Connect wallet
    </Button>
  )
}

export default WalletLogin
