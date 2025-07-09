import { Button, Tooltip } from '@mui/material'
import { useContext } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

import CheckWallet from '@/components/common/CheckWallet'
import { useRecoveryTxState } from '@/features/recovery/hooks/useRecoveryTxState'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { useCurrentChain } from '@/hooks/useChains'
import { TxModalContext } from '@/components/tx-flow'
import { RecoveryAttemptFlow } from '@/components/tx-flow/flows'

export function ExecuteRecoveryButton({
  recovery,
  compact = false,
}: {
  recovery: RecoveryQueueItem
  compact?: boolean
}): ReactElement {
  const { isExecutable, isNext, isPending } = useRecoveryTxState(recovery)
  const isDisabled = !isExecutable || isPending
  const isWrongChain = useIsWrongChain()
  const chain = useCurrentChain()
  const { setTxFlow } = useContext(TxModalContext)

  const onClick = async (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()

    setTxFlow(<RecoveryAttemptFlow item={recovery} />)
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
