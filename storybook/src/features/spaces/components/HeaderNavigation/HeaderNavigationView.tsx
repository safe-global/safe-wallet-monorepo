import type { MouseEvent, ReactElement, ReactNode } from 'react'
import { Search, Bell, Wallet, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import IconAction from '@/components/common/IconAction'
import { ICON_STROKE } from '@/components/common/iconStroke'
import { cn } from '@/utils/cn'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import { BATCH_EVENTS } from '@/services/analytics/events/batching'

export type HeaderNavigationViewProps = {
  walletAddress: string
  walletEns?: string
  isConnected: boolean
  identiconUrl: string | null
  providerIconSrc: string | null
  walletLabel?: string
  messages: number
  showSearch: boolean
  onSearchClick?: () => void
  onNotificationsClick?: (event: MouseEvent<HTMLButtonElement>) => void
  onWalletClick?: (event: MouseEvent<HTMLButtonElement>) => void
  walletConnectSlot?: ReactNode
  showBatch: boolean
  onBatchClick?: () => void
  batchCount: number
  renderBatchTooltip: (children: ReactElement) => ReactNode
}

export function HeaderNavigationView({
  walletAddress,
  walletEns,
  isConnected,
  identiconUrl,
  providerIconSrc,
  walletLabel,
  messages,
  showSearch,
  onSearchClick,
  onNotificationsClick,
  onWalletClick,
  walletConnectSlot,
  showBatch,
  onBatchClick,
  batchCount,
  renderBatchTooltip,
}: HeaderNavigationViewProps) {
  const truncatedAddress =
    walletAddress.length > 12 ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : walletAddress

  const walletDisplayName = walletEns || truncatedAddress

  return (
    <div className={cn('flex items-center gap-1')}>
      {/* TODO: Global search button */}
      {showSearch && (
        <div className="flex items-center rounded-lg bg-muted">
          <IconAction onClick={onSearchClick} aria-label="Search">
            <Search className="size-5 text-muted-foreground" strokeWidth={ICON_STROKE} />
          </IconAction>
        </div>
      )}

      <div className="relative flex items-center rounded-lg bg-muted" data-testid="notifications-center">
        <IconAction onClick={onNotificationsClick} aria-label="Notifications">
          <Bell className="size-5 text-muted-foreground" strokeWidth={ICON_STROKE} />
        </IconAction>

        {messages > 0 && (
          <span
            className="absolute z-10 flex items-center justify-center rounded-full bg-[rgba(18,255,128,0.1)] text-[10px] font-medium leading-none text-secondary-foreground min-w-[18px] h-[18px] px-1 -top-[2px] -right-[4px]"
            aria-label={`${messages} unread messages`}
          >
            {messages > 99 ? '99+' : messages}
          </span>
        )}
      </div>

      {walletConnectSlot}

      {showBatch &&
        renderBatchTooltip(
          <Track {...BATCH_EVENTS.BATCH_SIDEBAR_OPEN} label={batchCount}>
            <div className="relative flex items-center rounded-lg bg-muted" data-track="batching: Batch sidebar open">
              <IconAction onClick={onBatchClick} aria-label="Batch transactions">
                <Layers className="size-5 text-muted-foreground" strokeWidth={ICON_STROKE} />
              </IconAction>

              {batchCount > 0 && (
                <span
                  className="absolute z-10 flex items-center justify-center rounded-full bg-[rgba(18,255,128,0.1)] text-[10px] font-medium leading-none text-secondary-foreground min-w-[18px] h-[18px] px-1 -top-[2px] -right-[4px]"
                  aria-label={`${batchCount} batched transactions`}
                >
                  {batchCount > 99 ? '99+' : batchCount}
                </span>
              )}
            </div>
          </Track>,
        )}

      <Track label={OVERVIEW_LABELS.top_bar} {...OVERVIEW_EVENTS.OPEN_ONBOARD}>
        <div className="flex items-center rounded-lg bg-muted">
          <Button
            variant="ghost"
            size="chip"
            onClick={onWalletClick}
            className="m-1"
            aria-label={isConnected ? `Wallet ${walletDisplayName}` : 'Connect wallet'}
            data-testid={isConnected ? 'open-account-center' : 'connect-wallet-btn'}
          >
            {isConnected && identiconUrl ? (
              <div className="relative shrink-0">
                <img src={identiconUrl} alt="Wallet identicon" className="size-6 rounded-full" />
                {providerIconSrc && (
                  <img
                    src={providerIconSrc}
                    alt={`${walletLabel ?? 'Wallet'} logo`}
                    className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-card bg-background p-px"
                  />
                )}
              </div>
            ) : (
              <Wallet className="size-5 text-muted-foreground" strokeWidth={ICON_STROKE} />
            )}
            <span className="text-xs text-muted-foreground font-normal">
              {isConnected ? walletDisplayName : 'Connect Wallet'}
            </span>
          </Button>
        </div>
      </Track>
    </div>
  )
}
