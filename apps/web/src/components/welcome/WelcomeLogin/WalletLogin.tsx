import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import useWallet from '@/hooks/wallets/useWallet'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import EthHashInfo from '@/components/common/EthHashInfo'
import WalletIcon from '@/components/common/WalletIcon'
import { useEffect, useState } from 'react'
import { WalletMinimal } from 'lucide-react'
import css from './styles.module.css'

// 'walletBtnStatic' is intentionally theme-agnostic — used on the welcome page which has a fixed white background
export type WalletLoginButtonStyle = 'walletBtnPrimary' | 'walletBtnSecondary' | 'walletBtnStatic'

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
        variant="default"
        size="lg"
        onClick={onContinue}
        className={cn(css[buttonStyle], { 'w-full': fullWidth })}
        data-testid="continue-with-wallet-btn"
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner className="size-5" />
        ) : (
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex flex-col items-start">
              <Typography variant="paragraph-small-bold">
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
            </div>
            {wallet.icon && <WalletIcon icon={wallet.icon} provider={wallet.label} width={24} height={24} />}
          </div>
        )}
      </Button>
    )
  }

  return (
    <Button
      onClick={onConnectWallet}
      className={cn(css[buttonStyle], { 'w-full': fullWidth })}
      variant="default"
      size="sm"
      data-testid="connect-wallet-btn"
    >
      {buttonStyle === 'walletBtnSecondary' && <WalletMinimal size={18} />}
      {buttonText?.disconnected ?? 'Connect wallet'}
    </Button>
  )
}

export default WalletLogin
