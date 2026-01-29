import RecoveryModal from '@/features/recovery/components/RecoveryModal'
import { useRecoveryTxNotifications } from '@/features/recovery/hooks/useRecoveryTxNotification'
import RecoveryContextHooks from '../RecoveryContext/RecoveryContextHooks'
import { useIsRecoverySupported } from '../../hooks/useIsRecoverySupported'

function Recovery() {
  const isSupported = useIsRecoverySupported()
  useRecoveryTxNotifications()

  if (!isSupported) return null

  return (
    <>
      <RecoveryContextHooks />
      <RecoveryModal />
    </>
  )
}

export default Recovery
