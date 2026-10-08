import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import useWallet from '@/hooks/wallets/useWallet'
import { useEffect, useState } from 'react'
import {
  WalletLoginView,
  type WalletLoginButtonStyle,
  type WalletLoginButtonText,
} from '@views/components/welcome/WelcomeLogin/WalletLoginView'

export type { WalletLoginButtonStyle, WalletLoginButtonText }

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

  return (
    <WalletLoginView
      wallet={wallet}
      onContinue={onContinue}
      onConnectWallet={onConnectWallet}
      buttonText={buttonText}
      fullWidth={fullWidth}
      isLoading={isLoading}
      buttonStyle={buttonStyle}
    />
  )
}

export default WalletLogin
