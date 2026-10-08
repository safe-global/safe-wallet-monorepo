import type { ReactElement } from 'react'

import { AuditRow } from '@/components/common/AuditLog'
import ExecuteRecoveryButton from '../ExecuteRecoveryButton'
import CancelRecoveryButton from '../CancelRecoveryButton'
import { useRecoveryTxState } from '../../hooks/useRecoveryTxState'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import useAddressBook from '@/hooks/useAddressBook'
import { RecoverySignersView } from '@views/features/recovery/components/RecoverySigners/RecoverySignersView'

export default function RecoverySigners({ item }: { item: RecoveryQueueItem }): ReactElement {
  const { isExecutable, isExpired, isNext, remainingSeconds } = useRecoveryTxState(item)
  const addressBook = useAddressBook()

  return (
    <RecoverySignersView
      isExecutable={isExecutable}
      isExpired={isExpired}
      isNext={isNext}
      remainingSeconds={remainingSeconds}
      executor={item.executor}
      executorName={addressBook[item.executor]}
      timestamp={item.timestamp}
      expiresAt={item.expiresAt}
      renderAuditRow={(props) => <AuditRow {...props} />}
      executeButton={<ExecuteRecoveryButton recovery={item} />}
      cancelButton={<CancelRecoveryButton recovery={item} />}
    />
  )
}
