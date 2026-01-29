import RecoveryModal from '@/features/recovery/components/RecoveryModal'
import { useRecoveryTxNotifications } from '@/features/recovery/hooks/useRecoveryTxNotification'
import RecoveryContextHooks from '../RecoveryContext/RecoveryContextHooks'

function LazyRecovery() {
  useRecoveryTxNotifications()

  return (
    <>
      <RecoveryContextHooks />
      <RecoveryModal />
    </>
  )
}

export default LazyRecovery
