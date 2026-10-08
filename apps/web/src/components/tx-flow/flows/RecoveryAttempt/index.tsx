import TxLayout from '@/components/tx-flow/common/TxLayout'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import RecoveryAttemptReview from './RecoveryAttemptReview'
import type { RecoveryQueueItem } from '@/features/recovery'
import { RECOVERY_ATTEMPT_FLOW_COPY as COPY } from '@views/components/tx-flow/flows/RecoveryAttempt/copy'

const RecoveryAttemptFlow = ({ item }: { item: RecoveryQueueItem }) => {
  return (
    <TxLayout title={COPY.title} subtitle={COPY.subtitle} icon={SaveAddressIcon} step={0} hideNonce hideSafeShield>
      <RecoveryAttemptReview item={item} />
    </TxLayout>
  )
}

export default RecoveryAttemptFlow
