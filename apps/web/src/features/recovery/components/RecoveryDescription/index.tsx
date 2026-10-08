import { useMemo } from 'react'
import type { ReactElement } from 'react'

import { useIsRecoverer } from '../../hooks/useIsRecoverer'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getRecoveredSafeInfo } from '../../services/transaction-list'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import { RecoveryDescriptionView } from '@views/features/recovery/components/RecoveryDescription/RecoveryDescriptionView'

export default function RecoveryDescription({ item }: { item: RecoveryQueueItem }): ReactElement {
  const { args, isMalicious } = item
  const { safe } = useSafeInfo()
  const isRecoverer = useIsRecoverer()

  // Keyed on the owner addresses, not the array: a safe-info refresh rebuilds the array.
  const ownersKey = safe.owners.map((owner) => owner.value).join(',')

  const newSetup = useMemo(
    () => getRecoveredSafeInfo(safe, { to: args.to, value: args.value.toString(), data: args.data }),
    // We only render the threshold and owners
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [args.data, args.to, args.value, safe.threshold, ownersKey],
  )

  return <RecoveryDescriptionView isMalicious={isMalicious} isRecoverer={isRecoverer} newSetup={newSetup} />
}
