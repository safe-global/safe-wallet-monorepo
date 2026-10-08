import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import { useRecoveryTxState } from '../../hooks/useRecoveryTxState'
import { ActionCard } from '@/components/common/ActionCard'
import { AppRoutes } from '@/config/routes'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import { RecoveryInProgressCardView } from '@views/features/recovery/components/RecoveryCards/RecoveryInProgressCardView'

type Props =
  | {
      orientation?: 'vertical'
      onClose: () => void
      recovery: RecoveryQueueItem
    }
  | {
      orientation: 'horizontal'
      onClose?: never
      recovery: RecoveryQueueItem
    }

export function RecoveryInProgressCard({ orientation = 'vertical', onClose, recovery }: Props): ReactElement {
  const { isExecutable, isExpired, remainingSeconds } = useRecoveryTxState(recovery)
  const router = useRouter()

  const onClick = async () => {
    await router.push({
      pathname: AppRoutes.transactions.queue,
      query: router.query,
    })
    onClose?.()
  }

  return (
    <RecoveryInProgressCardView
      orientation={orientation}
      isExecutable={isExecutable}
      isExpired={isExpired}
      remainingSeconds={remainingSeconds}
      onClick={onClick}
      renderActionCard={(props) => <ActionCard {...props} />}
    />
  )
}
