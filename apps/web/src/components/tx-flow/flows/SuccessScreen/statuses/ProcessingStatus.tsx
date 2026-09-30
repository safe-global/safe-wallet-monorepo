// Extract status handling into separate components
import { useLoadFeature } from '@/features/__core__'
import { SpeedupFeature } from '@/features/speedup'
import { PendingStatus, type PendingTx } from '@/store/pendingTxsSlice'
import { Typography } from '@/components/ui/typography'

type Props = {
  txId: string
  pendingTx: PendingTx
  willDeploySafe: boolean
}
export const ProcessingStatus = ({ txId, pendingTx, willDeploySafe: isCreatingSafe }: Props) => {
  const { SpeedUpMonitor } = useLoadFeature(SpeedupFeature)

  return (
    <div className="mt-6 px-6">
      <Typography data-testid="transaction-status" variant="h4" className="mt-4">
        {!isCreatingSafe ? 'Transaction is now processing' : 'Nested Safe is now being created'}
      </Typography>
      <Typography variant="paragraph-small" className="mb-6 block">
        {!isCreatingSafe ? 'The transaction' : 'Your Nested Safe'} was confirmed and is now being processed.
      </Typography>
      <div>
        {pendingTx.status === PendingStatus.PROCESSING && (
          <SpeedUpMonitor txId={txId} pendingTx={pendingTx} modalTrigger="alertBox" />
        )}
      </div>
    </div>
  )
}
