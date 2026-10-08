import useWallet from '@/hooks/wallets/useWallet'
import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { useContext } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import { CancelRecoveryFlow } from '@/components/tx-flow/flows'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { dispatchRecoverySkipExpired } from '../../services/recovery-sender'
import useSafeInfo from '@/hooks/useSafeInfo'
import { trackError, Errors } from '@/services/exceptions'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { useRecoveryTxState } from '../../hooks/useRecoveryTxState'
import { RecoveryListItemContext } from '@views/features/recovery/components/RecoveryListItem/RecoveryListItemContext'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import { CancelRecoveryButtonView } from '@views/features/recovery/components/CancelRecoveryButton/CancelRecoveryButtonView'

export default function CancelRecoveryButton({
  recovery,
  compact = false,
}: {
  recovery: RecoveryQueueItem
  compact?: boolean
}): ReactElement {
  const { setSubmitError } = useContext(RecoveryListItemContext)
  const isOwner = useIsSafeOwner()
  const { isExpired, isPending } = useRecoveryTxState(recovery)
  const { setTxFlow } = useContext(TxModalContext)
  const wallet = useWallet()
  const { safe } = useSafeInfo()

  const onClick = async (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()

    trackEvent(RECOVERY_EVENTS.CANCEL_RECOVERY)
    if (isOwner) {
      setTxFlow(<CancelRecoveryFlow recovery={recovery} />)
    } else if (wallet) {
      try {
        await dispatchRecoverySkipExpired({
          provider: wallet.provider,
          chainId: safe.chainId,
          delayModifierAddress: recovery.address,
          recoveryTxHash: recovery.args.txHash,
          signerAddress: wallet.address,
        })
      } catch (_err) {
        const err = asError(_err)

        trackError(Errors._813, err)
        setSubmitError(err)
      }
    }
  }

  return (
    <CancelRecoveryButtonView
      isOwner={isOwner}
      isExpired={isExpired}
      isPending={isPending}
      compact={compact}
      onClick={onClick}
      renderCheckWallet={(children) => (
        <CheckWallet allowNonOwner checkNetwork>
          {children}
        </CheckWallet>
      )}
    />
  )
}
