import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button'

export type CancelRecoveryButtonViewProps = {
  isOwner: boolean
  isExpired: boolean
  isPending: boolean
  compact: boolean
  onClick: (e: SyntheticEvent) => void
  renderCheckWallet: (children: (isOk: boolean) => ReactElement) => ReactNode
}

export const CancelRecoveryButtonView = ({
  isOwner,
  isExpired,
  isPending,
  compact,
  onClick,
  renderCheckWallet,
}: CancelRecoveryButtonViewProps) => {
  return (
    <>
      {renderCheckWallet((isOk) => {
        const isDisabled = isPending || (isOwner ? !isOk : !isOk || !isExpired)

        return (
          <Button
            data-testid="cancel-recovery-btn"
            onClick={onClick}
            variant="destructive"
            disabled={isDisabled}
            size={compact ? 'sm' : 'action'}
          >
            Cancel
          </Button>
        )
      })}
    </>
  )
}
