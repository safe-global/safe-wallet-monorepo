import type { ReactElement, ReactNode, Ref } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import Identicon from '@/components/common/Identicon'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TriangleAlert, RotateCw } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import FiatBalance from '@/components/common/FiatBalance'
import { ThresholdBadge } from '@/components/common/AccountBadges'
import { cn } from '@/utils/cn'
import CopyAddressIconButton from '@/components/common/CopyAddressIconButton'

export type SafeCardReadOnlyViewProps = {
  address: string
  displayName?: string
  isSimilar?: boolean
  cardClassName?: string
  cardRef?: Ref<HTMLDivElement>
  isClickable: boolean
  onClick?: () => void
  /** No Safe data to open: the card explains why on hover. */
  isMissingSafeData: boolean
  disabled: boolean
  disabledTooltip?: string
  showPending: boolean
  isLoadingOverview: boolean
  isOverviewError: boolean
  overviewErrorStatus?: string | number
  onRetryOverview: () => void
  queuedCount: number
  hasQueuedItems: boolean
  renderChainBadge: (props: { className: string }) => ReactNode
  isUndeployed: boolean
  statusChip: ReactNode
  fiatValue?: string
  threshold: number
  ownersCount: number
  action?: ReactNode
  contextMenu?: ReactNode
}

export const SafeCardReadOnlyView = ({
  address,
  displayName,
  isSimilar,
  cardClassName,
  cardRef,
  isClickable,
  onClick,
  isMissingSafeData,
  disabled,
  disabledTooltip,
  showPending,
  isLoadingOverview,
  isOverviewError,
  overviewErrorStatus,
  onRetryOverview,
  queuedCount,
  hasQueuedItems,
  renderChainBadge,
  isUndeployed,
  statusChip,
  fiatValue,
  threshold,
  ownersCount,
  action,
  contextMenu,
}: SafeCardReadOnlyViewProps): ReactElement => {
  const tooltipTitle = disabled ? (disabledTooltip ?? '') : isMissingSafeData ? 'Safe data is not available' : ''

  const card = (
    <div
      ref={cardRef}
      data-testid="safe-list-item"
      onClick={onClick}
      className={cn(
        'box-border flex w-full min-w-0 max-w-full items-center gap-1.5 rounded-3xl border-2 border-card bg-card py-4 pl-3 pr-3 transition-colors sm:gap-2 sm:pl-6 sm:pr-6',
        {
          'cursor-pointer hover:bg-muted/100': isClickable,
          'cursor-not-allowed opacity-60': !isClickable,
        },
        cardClassName,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <span className="inline-flex shrink-0">
          <Identicon address={address} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {isSimilar && (
            <Badge variant="warning" className="self-start -ml-px">
              <TriangleAlert data-icon="inline-start" />
              High similarity
            </Badge>
          )}
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-base font-medium text-foreground">
              {displayName || shortenAddress(address)}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="block min-w-0 break-all text-xs text-muted-foreground">
              {isSimilar ? (
                <>
                  {address.slice(0, 2)}
                  <b>{address.slice(2, 6)}</b>
                  {address.slice(6, -4)}
                  <b>{address.slice(-4)}</b>
                </>
              ) : (
                shortenAddress(address)
              )}
            </span>
            <CopyAddressIconButton address={address} />
          </div>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center justify-end gap-1 pl-1 sm:pl-2">
        {isLoadingOverview ? (
          <div className="flex shrink-0 items-center gap-1 mr-8">
            <Skeleton className="h-6 w-20" />
          </div>
        ) : isOverviewError ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRetryOverview()
                  }}
                  className="flex shrink-0 cursor-pointer items-center gap-1 mr-8 rounded px-1.5 py-0.5 text-destructive transition-colors hover:bg-destructive/10"
                  type="button"
                />
              }
            >
              <TriangleAlert className="size-4" />
              <RotateCw className="size-3" />
              <span className="text-xs">Retry</span>
            </TooltipTrigger>
            <TooltipContent>
              {`Failed to load transaction data. ${
                overviewErrorStatus !== undefined ? `Error: ${overviewErrorStatus}` : 'Please try again.'
              }`}
            </TooltipContent>
          </Tooltip>
        ) : (
          showPending &&
          hasQueuedItems && (
            <div className="flex shrink-0 items-center gap-1 mr-8">
              <Badge variant="secondary">{queuedCount} pending</Badge>
            </div>
          )
        )}
        {renderChainBadge({ className: 'justify-end' })}
      </div>

      <div
        data-testid="balance-column"
        className="flex min-w-0 shrink-0 flex-col items-end gap-2 pl-1 sm:min-w-16 sm:pl-0"
      >
        {isUndeployed ? statusChip : <FiatBalance value={fiatValue} />}
        {threshold > 0 && <ThresholdBadge threshold={threshold} owners={ownersCount} />}
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
        {action}
        {contextMenu}
      </div>
    </div>
  )

  if (!tooltipTitle) return card

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="contents" />}>{card}</TooltipTrigger>
      <TooltipContent>{tooltipTitle}</TooltipContent>
    </Tooltip>
  )
}
