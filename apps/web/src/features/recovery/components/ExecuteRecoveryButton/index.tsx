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

  return (
    <CheckWallet allowNonOwner checkNetwork={!isDisabled}>
      {(isOk) => {
        const tooltipTitle =
          !isOk || isDisabled
            ? isWrongChain
              ? `Switch your wallet network to ${chain?.chainName} to execute this transaction`
              : isNext
                ? 'You can execute the recovery after the specified review window'
                : 'Previous recovery proposals must be executed or cancelled first'
            : null

        const button = (
          <Button
            data-testid="execute-btn"
            onClick={onClick}
            variant="default"
            disabled={!isOk || isDisabled}
            className="min-w-[106.5px]"
            size={compact ? 'sm' : 'lg'}
          >
            Execute
          </Button>
        )

        if (!tooltipTitle) {
          return button
        }

        return (
          <Tooltip>
            <TooltipTrigger render={<span />}>{button}</TooltipTrigger>
            <TooltipContent>{tooltipTitle}</TooltipContent>
          </Tooltip>
        )
      }}
    </CheckWallet>
  )
}
