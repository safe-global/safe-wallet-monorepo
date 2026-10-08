import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type ExecuteRecoveryButtonViewProps = {
  isWrongChain: boolean
  chainName?: string
  isDisabled: boolean
  isNext: boolean
  compact: boolean
  onClick: (e: SyntheticEvent) => void
  renderCheckWallet: (children: (isOk: boolean) => ReactElement) => ReactNode
}

export const ExecuteRecoveryButtonView = ({
  isWrongChain,
  chainName,
  isDisabled,
  isNext,
  compact,
  onClick,
  renderCheckWallet,
}: ExecuteRecoveryButtonViewProps) => {
  const getRecoveryBlockedReason = (): string | null => {
    if (isWrongChain) {
      return `Switch your wallet network to ${chainName} to execute this transaction`
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
    <>
      {renderCheckWallet((isOk) => {
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
      })}
    </>
  )
}
