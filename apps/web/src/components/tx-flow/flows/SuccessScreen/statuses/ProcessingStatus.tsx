// Extract status handling into separate components
import { useLoadFeature } from '@/features/__core__'
import { SpeedupFeature } from '@/features/speedup'
import { PendingStatus, type PendingTx } from '@/store/pendingTxsSlice'
import { ProcessingStatusView } from '@views/components/tx-flow/flows/SuccessScreen/statuses/ProcessingStatusView'

type Props = {
  txId: string
  pendingTx: PendingTx
  willDeploySafe: boolean
}
export const ProcessingStatus = ({ txId, pendingTx, willDeploySafe }: Props) => {
  const { SpeedUpMonitor } = useLoadFeature(SpeedupFeature)

  return (
    <ProcessingStatusView
      willDeploySafe={willDeploySafe}
      renderSpeedUp={
        pendingTx.status === PendingStatus.PROCESSING
          ? (modalTrigger) => <SpeedUpMonitor txId={txId} pendingTx={pendingTx} modalTrigger={modalTrigger} />
          : undefined
      }
    />
  )
}
