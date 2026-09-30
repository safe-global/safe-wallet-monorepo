import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import GnosisPayIcon from '@/public/images/common/gnosis-pay.svg'
import { useIsGnosisPaySafe } from './hooks/useIsGnosisPaySafe'

/**
 * Renders a small read-only banner whenever the current Safe is a Gnosis Pay
 * safe. Visible to anyone, regardless of whether they're the wallet enabled
 * on the Delay modifier — the actual write actions are gated separately.
 */
export const GnosisPayBanner = () => {
  const [isGnosisPaySafe] = useIsGnosisPaySafe()

  if (!isGnosisPaySafe) return null

  return (
    <Alert variant="info" className="mb-4">
      <GnosisPayIcon className="size-5" aria-label="Gnosis Pay" />
      <AlertTitle>Gnosis Pay</AlertTitle>
      <AlertDescription>
        Transactions on this Safe are queued through a Delay modifier with a 3-minute cooldown before they can be
        executed.
      </AlertDescription>
    </Alert>
  )
}

export default GnosisPayBanner
