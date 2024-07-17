import { Button, Tooltip } from '@mui/material'
import { useContext } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

import CheckWallet from '@/components/common/CheckWallet'
import { dispatchRecoveryExecution } from '@/features/recovery/services/recovery-sender'
import useOnboard from '@/hooks/wallets/useOnboard'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useRecoveryTxState } from '@/features/recovery/hooks/useRecoveryTxState'
import { Errors, trackError } from '@/services/exceptions'
import { asError } from '@/services/exceptions/utils'
import { RecoveryListItemContext } from '../RecoveryListItem/RecoveryListItemContext'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import useWallet from '@/hooks/wallets/useWallet'

export function ExecuteRecoveryButton({
  recovery,
  compact = false,
}: {
  recovery: RecoveryQueueItem
  compact?: boolean
}): ReactElement {
  const { setSubmitError } = useContext(RecoveryListItemContext)
  const { isExecutable, isNext, isPending } = useRecoveryTxState(recovery)
  const onboard = useOnboard()
  const { safe } = useSafeInfo()
  const wallet = useWallet()
  const onClick = async (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!wallet) {
      return
    }

    try {
      await dispatchRecoveryExecution({
        _wallet: wallet,
        chainId: safe.chainId,
        args: recovery.args,
        delayModifierAddress: recovery.address,
      })
    } catch (_err) {
      const err = asError(_err)

      trackError(Errors._812, e)
      setSubmitError(err)
    }
  }

  return (
    <CheckWallet allowNonOwner>
      {(isOk) => {
        const isDisabled = !isOk || !isExecutable || isPending

        return (
          <Tooltip
            title={
              isDisabled
                ? isNext
                  ? 'You can execute the recovery after the specified review window'
                  : 'Previous recovery proposals must be executed or cancelled first'
                : null
            }
          >
            <span>
              <Button
                data-testid="execute-btn"
                onClick={onClick}
                variant="contained"
                disabled={isDisabled}
                size={compact ? 'small' : 'stretched'}
              >
                Execute
              </Button>
            </span>
          </Tooltip>
        )
      }}
    </CheckWallet>
  )
}
