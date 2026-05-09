import TxLayout from '@/components/tx-flow/common/TxLayout'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import RecoveryAttemptReview from './RecoveryAttemptReview'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

const RecoveryAttemptFlow = ({ item }: { item: RecoveryQueueItem }) => {
  return (
    <TxLayout title="Recovery" subtitle="Execute recovery" icon={SaveAddressIcon} step={0} hideNonce hideSafeShield>
      <RecoveryAttemptReview item={item} />
    </TxLayout>
  )
}

export default RecoveryAttemptFlow
