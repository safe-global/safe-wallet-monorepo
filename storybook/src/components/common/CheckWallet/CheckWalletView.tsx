import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const MESSAGES = {
  walletNotConnected: 'Please connect your wallet',
  sdkNotInitialized: 'Still loading. Try again in a moment.',
  notSafeOwner: 'Your connected wallet is not a signer of this Safe account',
  safeNotActivated: 'You need to activate the Safe before transacting',
}

export type CheckWalletReason = keyof typeof MESSAGES

export type CheckWalletViewProps = {
  reason: CheckWalletReason
  onTriggerClick?: () => void
  testId?: string
  children: ReactElement
}

export const CheckWalletView = ({ reason, onTriggerClick, testId, children }: CheckWalletViewProps): ReactElement => {
  const message = MESSAGES[reason]

  return (
    <Tooltip>
      <TooltipTrigger render={<span data-testid={testId} aria-label={message} onClick={onTriggerClick} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  )
}
