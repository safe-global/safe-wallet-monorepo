import useWallet from '@/hooks/wallets/useWallet'
import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import { NoWalletConnectedWarningView } from '@views/components/new-safe/create/NoWalletConnectedWarning/NoWalletConnectedWarningView'

const NoWalletConnectedWarning = () => {
  const wallet = useWallet()

  if (wallet) {
    return null
  }

  return <NoWalletConnectedWarningView renderConnectWalletButton={(props) => <ConnectWalletButton {...props} />} />
}

export default NoWalletConnectedWarning
