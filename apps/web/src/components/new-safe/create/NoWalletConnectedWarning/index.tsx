import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { TriangleAlert } from 'lucide-react'
import useWallet from '@/hooks/wallets/useWallet'
import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'

const NoWalletConnectedWarning = () => {
  const wallet = useWallet()

  if (wallet) {
    return null
  }

  return (
    <Alert variant="warning" className="mt-6">
      <TriangleAlert />
      <AlertTitle className="font-bold">No wallet connected</AlertTitle>
      <AlertDescription>
        You need to connect a wallet to create a Safe account.
        <div className="mt-4">
          <ConnectWalletButton fullWidth />
        </div>
      </AlertDescription>
    </Alert>
  )
}

export default NoWalletConnectedWarning
