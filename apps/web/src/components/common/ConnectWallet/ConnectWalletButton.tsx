import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import {
  ConnectWalletButtonView,
  type ConnectWalletButtonViewProps,
} from '@views/components/common/ConnectWallet/ConnectWalletButtonView'

const ConnectWalletButton = ({
  onConnect,
  ...buttonProps
}: {
  onConnect?: () => void
  contained?: boolean
  variant?: ConnectWalletButtonViewProps['variant']
  size?: ConnectWalletButtonViewProps['size']
  text?: string
  className?: string
  fullWidth?: boolean
}): React.ReactElement => {
  const connectWallet = useConnectWallet()

  const handleConnect = () => {
    onConnect?.()
    connectWallet()
  }

  return <ConnectWalletButtonView {...buttonProps} onClick={handleConnect} />
}

export default ConnectWalletButton
