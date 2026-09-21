import RecoveryModal from '../RecoveryModal'
import { useRecoveryTxNotifications } from '../../hooks/useRecoveryTxNotification'
import RecoveryContextHooks from '../RecoveryContext/RecoveryContextHooks'

function RecoveryContent() {
  useRecoveryTxNotifications()

  return (
    <>
      <RecoveryContextHooks />
      <RecoveryModal />
    </>
  )
}

export default RecoveryContent
