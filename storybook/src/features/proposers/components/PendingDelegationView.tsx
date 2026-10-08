import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { Countdown } from '@/components/common/Countdown'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { PendingDelegation } from '@/features/proposers/types'

export type PendingDelegationViewProps = {
  delegation: PendingDelegation
  remainingSeconds: number
  hasAlreadySigned: boolean
  shareUrl: string
  isSubmitting: boolean
  isSignLoading: boolean
  hasError: boolean
  onSubmit: () => void
  onSign: () => void
  renderCopyTooltip: (props: { initialToolTipText: string; children: ReactElement }) => ReactNode
  renderErrorMessage: (fallback: string) => ReactNode
}

export function PendingDelegationView({
  delegation,
  remainingSeconds,
  hasAlreadySigned,
  shareUrl,
  isSubmitting,
  isSignLoading,
  hasError,
  onSubmit,
  onSign,
  renderCopyTooltip,
  renderErrorMessage,
}: PendingDelegationViewProps): ReactElement {
  function renderActionButton(): ReactNode {
    if (delegation.status === 'ready') {
      return (
        <Button size="sm" onClick={onSubmit} disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? <Spinner className="size-4" /> : 'Submit delegation'}
        </Button>
      )
    }

    if (delegation.status !== 'pending') {
      return null
    }

    if (hasAlreadySigned) {
      return renderCopyTooltip({
        initialToolTipText: 'Copy link to share',
        children: (
          <Button size="sm" variant="outline" className="min-w-[100px]" disabled={!shareUrl}>
            Copy link
          </Button>
        ),
      })
    }

    return (
      <Button size="sm" onClick={onSign} disabled={isSignLoading} className="min-w-[80px]">
        {isSignLoading ? <Spinner className="size-4" /> : 'Sign'}
      </Button>
    )
  }

  return (
    <div>
      <div className="rounded-lg bg-[var(--color-border-background)] p-4">
        <div className="flex items-center gap-6">
          <Typography variant="paragraph-small" className="whitespace-nowrap">
            {delegation.action === 'remove' ? 'Remove proposer:' : 'New proposer:'}
          </Typography>
          <div className="[&_.ethHashInfo-name]:font-bold">
            <EthHashInfo address={delegation.delegateAddress} showCopyButton shortAddress={false} hasExplorer />
          </div>
        </div>
      </div>

      <Typography variant="paragraph-mini" color="muted" className="mt-2 block">
        {remainingSeconds > 0 ? (
          <>
            Expires in <Countdown seconds={remainingSeconds} />
          </>
        ) : (
          <Typography variant="paragraph-mini" className="text-destructive">
            Expired
          </Typography>
        )}
      </Typography>

      <div className="mt-4 flex items-center justify-between">
        <Typography variant="paragraph">
          <span className="font-bold">
            {delegation.confirmationsSubmitted}/{delegation.confirmationsRequired}
          </span>{' '}
          signatures collected
        </Typography>

        {renderActionButton()}
      </div>

      {hasError && (
        <div className="mt-2">
          {renderErrorMessage(
            delegation.status === 'ready' ? 'Error submitting delegation' : 'Error signing delegation',
          )}
        </div>
      )}
    </div>
  )
}
