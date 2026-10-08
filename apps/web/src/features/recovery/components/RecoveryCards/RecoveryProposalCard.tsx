import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import { useDarkMode } from '@/hooks/useDarkMode'
import { ActionCard } from '@/components/common/ActionCard'
import { RecoverAccountFlow } from '@/components/tx-flow/flows'
import madProps from '@/utils/mad-props'
import { TxModalContext } from '@/components/tx-flow'
import type { TxModalContextType } from '@/components/tx-flow'
import { RecoveryProposalCardView } from '@views/features/recovery/components/RecoveryCards/RecoveryProposalCardView'

type Props =
  | {
      orientation?: 'vertical'
      onClose: () => void
      setTxFlow: TxModalContextType['setTxFlow']
    }
  | {
      orientation: 'horizontal'
      onClose?: never
      setTxFlow: TxModalContextType['setTxFlow']
    }

export function InternalRecoveryProposalCard({ orientation = 'vertical', onClose, setTxFlow }: Props): ReactElement {
  const isDarkMode = useDarkMode()

  const handleRecover = () => {
    onClose?.()
    setTxFlow(<RecoverAccountFlow />)
  }

  const handleRecoverWithTracking = () => {
    trackEvent(RECOVERY_EVENTS.START_RECOVERY)
    handleRecover()
  }

  return (
    <RecoveryProposalCardView
      orientation={orientation}
      isDarkMode={isDarkMode}
      onRecover={handleRecover}
      onRecoverWithTracking={handleRecoverWithTracking}
      onPostpone={() => {
        trackEvent(RECOVERY_EVENTS.DISMISS_PROPOSAL_CARD)
        onClose?.()
      }}
      renderActionCard={(props) => <ActionCard {...props} />}
    />
  )
}

// Appease TypeScript
const InternalUseSetTxFlow = () => useContext(TxModalContext).setTxFlow

export const RecoveryProposalCard = madProps(InternalRecoveryProposalCard, {
  setTxFlow: InternalUseSetTxFlow,
})
