import { useContext } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import CheckWallet from '@/components/common/CheckWallet'
import { useRecoveryTxState } from '../../hooks/useRecoveryTxState'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { useCurrentChain } from '@/hooks/useChains'
import { TxModalContext } from '@/components/tx-flow'
import { RecoveryAttemptFlow } from '@/components/tx-flow/flows'

export default function ExecuteRecoveryButton({
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

  const getRecoveryBlockedReason = (): string | null => {
    if (isWrongChain) {
      return `Switch your wallet network to ${chain?.chainName} to execute this transaction`
    }
    if (!isDisabled) {
      return null
    }
    return isNext
      ? 'You can execute the recovery after the specified review window'
      : 'Previous recovery proposals must be executed or cancelled first'
  }

  const blockedReason = getRecoveryBlockedReason()

  return (
    <CheckWallet allowNonOwner checkNetwork={!isDisabled}>
      {(isOk) => {
        const button = (
          <Button
            data-testid="execute-btn"
            onClick={onClick}
            variant="default"
            disabled={!isOk || isDisabled}
            size={compact ? 'default' : 'action'}
          >
            Execute
          </Button>
        )

        if (!blockedReason) {
          return button
        }

        return (
          <Tooltip>
            <TooltipTrigger render={<span />}>{button}</TooltipTrigger>
            <TooltipContent>{blockedReason}</TooltipContent>
          </Tooltip>
        )
      }}
    </CheckWallet>
  )
}
