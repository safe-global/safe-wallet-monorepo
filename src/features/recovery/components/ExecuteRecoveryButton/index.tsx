import useWallet from '@/hooks/wallets/useWallet'
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
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { useCurrentChain } from '@/hooks/useChains'

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
  const wallet = useWallet()
  const { safe } = useSafeInfo()
  const isDisabled = !isExecutable || isPending
  const isWrongChain = useIsWrongChain()
  const chain = useCurrentChain()

  const onClick = async (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!onboard || !wallet) {
      return
    }

    try {
      await dispatchRecoveryExecution({
        provider: wallet.provider,
        chainId: safe.chainId,
        args: recovery.args,
        delayModifierAddress: recovery.address,
        signerAddress: wallet.address,
      })
    } catch (_err) {
      const err = asError(_err)

      trackError(Errors._812, e)
      setSubmitError(err)
    }
  }

  return (
    <CheckWallet allowNonOwner checkNetwork={!isDisabled}>
      {(isOk) => {
        return (
          <Tooltip
            title={
              !isOk || isDisabled
                ? isWrongChain
                  ? `Switch your wallet network to ${chain?.chainName} to execute this transaction`
                  : isNext
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
                disabled={!isOk || isDisabled}
                sx={{ minWidth: '106.5px', py: compact ? 0.8 : undefined }}
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
