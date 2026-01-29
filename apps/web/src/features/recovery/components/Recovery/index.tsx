import RecoveryModal from '@/features/recovery/components/RecoveryModal'
import { useRecoveryTxNotifications } from '@/features/recovery/hooks/useRecoveryTxNotification'
import RecoveryContextHooks from '../RecoveryContext/RecoveryContextHooks'
import { useIsRecoverySupported } from '../../hooks/useIsRecoverySupported'

function RecoveryContent() {
  useRecoveryTxNotifications()

  return (
    <>
      <RecoveryContextHooks />
      <RecoveryModal />
    </>
  )
}

function Recovery() {
  const isSupported = useIsRecoverySupported()

  if (!isSupported) return null

  return <RecoveryContent />
}

export default Recovery
