import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import useWallet from '@/hooks/wallets/useWallet'
import { Box, Button, CircularProgress, Typography } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'
import WalletIcon from '@/components/common/WalletIcon'
import { useEffect, useState } from 'react'

interface WalletLoginProps {
  onLogin: () => void
  onContinue: () => void
  buttonText?: string
  fullWidth?: boolean
  isLoading?: boolean
}

const WalletLogin = ({ onLogin, onContinue, buttonText, fullWidth, isLoading }: WalletLoginProps) => {
  const wallet = useWallet()
  const connectWallet = useConnectWallet()
  const [hasConnectedWallet, setHasConnectedWallet] = useState(false)

  useEffect(() => {
    if (hasConnectedWallet) {
      onLogin()
      setHasConnectedWallet(false)
    }
  }, [hasConnectedWallet])

  const onConnectWallet = async () => {
    const wallets = await connectWallet()

    setHasConnectedWallet(!!wallets?.length)
  }

  if (wallet !== null) {
    return (
      <Button
        variant="contained"
        sx={{ padding: '8px 16px' }}
        onClick={onContinue}
        fullWidth={fullWidth}
        style={{ color: '#fff', background: '#121312' }}
        data-testid="continue-with-wallet-btn"
        disabled={isLoading}
      >
        {isLoading ? (
          <CircularProgress size={20} />
        ) : (
          <Box justifyContent="space-between" display="flex" flexDirection="row" alignItems="center" gap={1}>
            <Box display="flex" flexDirection="column" alignItems="flex-start">
              <Typography variant="subtitle2" fontWeight={700}>
                {buttonText || 'Continue with'} {wallet.label}
              </Typography>
              {wallet.address && (
                <EthHashInfo
                  address={wallet.address}
                  shortAddress
                  avatarSize={16}
                  showName={false}
                  copyAddress={false}
                />
              )}
            </Box>
            {wallet.icon && <WalletIcon icon={wallet.icon} provider={wallet.label} width={24} height={24} />}
          </Box>
        )}
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
