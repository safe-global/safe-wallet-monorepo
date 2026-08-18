import { Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useIsMultichainSafe } from '../../hooks/useIsMultichainSafe'
import { useCurrentChain } from '@/hooks/useChains'

export const ChangeSignerSetupWarning = () => {
  const isMultichainSafe = useIsMultichainSafe()
  const currentChain = useCurrentChain()

  if (!isMultichainSafe) return

  return (
    <Alert variant="info" className="my-0 border-none">
      <Info />
      <AlertDescription>
        {`Signers are not consistent across networks on this account. Changing signers will only affect the account on ${currentChain?.chainName}`}
      </AlertDescription>
    </Alert>
  )
}
