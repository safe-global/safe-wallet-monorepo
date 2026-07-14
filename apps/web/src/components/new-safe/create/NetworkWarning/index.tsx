import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useCurrentChain } from '@/hooks/useChains'
import ChainSwitcher from '@/components/common/ChainSwitcher'
import useIsWrongChain from '@/hooks/useIsWrongChain'

const NetworkWarning = ({ action }: { action?: string }) => {
  const chain = useCurrentChain()
  const isWrongChain = useIsWrongChain()

  if (!chain || !isWrongChain) return null

  return (
    <Alert variant="warning">
      <AlertTitle className="font-bold">Change your wallet network</AlertTitle>
      <AlertDescription>
        You are trying to {action || 'sign or execute a transaction'} on {chain.chainName}. Make sure that your wallet
        is set to the same network.
        <div className="mt-4">
          <ChainSwitcher />
        </div>
      </AlertDescription>
    </Alert>
  )
}

export default NetworkWarning
