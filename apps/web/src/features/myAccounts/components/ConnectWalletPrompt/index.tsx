import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { ConnectWalletPromptView } from '@views/features/myAccounts/components/ConnectWalletPrompt/ConnectWalletPromptView'

/**
 * Prompt displayed when user is not connected to a wallet
 * Guides them to connect to see their Safes
 */
const ConnectWalletPrompt = () => {
  const connectWallet = useConnectWallet()

  return <ConnectWalletPromptView onConnect={connectWallet} />
}

export default ConnectWalletPrompt
