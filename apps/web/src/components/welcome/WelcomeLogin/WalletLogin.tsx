import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import useWallet from '@/hooks/wallets/useWallet'
import { Box, Button, CircularProgress, Typography } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'
import WalletIcon from '@/components/common/WalletIcon'
import { useEffect, useState } from 'react'
import css from './styles.module.css'

export type WalletLoginButtonStyle = 'walletBtnPrimary' | 'walletBtnSecondary'

export interface WalletLoginButtonText {
  connected?: string
  disconnected?: string
}

interface WalletLoginProps {
  onLogin: () => void
  onContinue: () => void
  buttonText?: WalletLoginButtonText
  fullWidth?: boolean
  isLoading?: boolean
  buttonStyle?: WalletLoginButtonStyle
}

const WalletLogin = ({
  onLogin,
  onContinue,
  buttonText,
  fullWidth,
  isLoading,
  buttonStyle = 'walletBtnPrimary',
}: WalletLoginProps) => {
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
        size="xlarge"
        onClick={onContinue}
        fullWidth={fullWidth}
        className={css[buttonStyle]}
        data-testid="continue-with-wallet-btn"
        disabled={isLoading}
      >
        {isLoading ? (
          <CircularProgress size={20} sx={{ color: '#fff' }} />
        ) : (
          <Box justifyContent="space-between" display="flex" flexDirection="row" alignItems="center" gap={1}>
            <Box display="flex" flexDirection="column" alignItems="flex-start">
              <Typography variant="subtitle2" fontWeight={700}>
                {buttonText?.connected ?? 'Continue with'} {wallet.label}
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
      className={css[buttonStyle]}
      variant="contained"
      size="small"
      disableElevation
      fullWidth={fullWidth}
      data-testid="connect-wallet-btn"
    >
      {buttonText?.disconnected ?? 'Connect wallet'}
    </Button>
  )
}

export default WalletLogin
