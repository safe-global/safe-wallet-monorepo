import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { ConnectWalletHintView } from '@views/features/spaces/components/ConnectWalletHintView'

/**
 * Inline hint shown when adding/selecting Safe accounts without a connected wallet.
 * `onConnect` lets the host intercept the click (e.g. to hide a dialog stacked above the wallet modal).
 */
const ConnectWalletHint = ({ testId, onConnect }: { testId?: string; onConnect?: () => void }) => {
  const connectWallet = useConnectWallet()

  return <ConnectWalletHintView testId={testId} onConnect={onConnect ?? connectWallet} />
}

export default ConnectWalletHint
