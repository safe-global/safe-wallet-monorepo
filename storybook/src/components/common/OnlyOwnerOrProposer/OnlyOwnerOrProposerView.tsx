import type { ReactElement } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export type OnlyOwnerOrProposerReason = 'walletNotConnected' | 'notSafeOwnerOrProposer'

const MESSAGES: Record<OnlyOwnerOrProposerReason, string> = {
  walletNotConnected: 'Please connect your wallet',
  notSafeOwnerOrProposer: 'Your connected wallet is not a signer or proposer of this Safe account',
}

export type OnlyOwnerOrProposerViewProps = {
  reason: OnlyOwnerOrProposerReason
  placement: 'top' | 'bottom' | 'left' | 'right'
  onClick?: () => void
  children: ReactElement
}

export function OnlyOwnerOrProposerView({
  reason,
  placement,
  onClick,
  children,
}: OnlyOwnerOrProposerViewProps): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger render={<span onClick={onClick}>{children}</span>} />
      <TooltipContent side={placement}>{MESSAGES[reason]}</TooltipContent>
    </Tooltip>
  )
}
