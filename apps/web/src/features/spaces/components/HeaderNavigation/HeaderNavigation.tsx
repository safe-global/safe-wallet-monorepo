import type { MouseEvent, ReactNode } from 'react'
import { Search, Bell, Wallet, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export interface HeaderNavigationProps {
  /**
   * Safe address to display (will be truncated)
   */
  walletAddress: string
  /**
   * Number of unread messages:
   * the parent can pass useAppSelector(selectNotifications).filter(n => !n.isRead).length into messages from Redux
   */
  messages?: number
  /**
   * Whether to show the search button
   */
  showSearch?: boolean
  /**
   * Callback when search button is clicked
   */
  onSearchClick?: () => void
  /**
   * Callback when notifications button is clicked
   */
  onNotificationsClick?: (event: MouseEvent<HTMLButtonElement>) => void
  /**
   * Callback when wallet button is clicked
   */
  onWalletClick?: (event: MouseEvent<HTMLButtonElement>) => void
  /** Slot for WalletConnect widget (renders its own button + popup) */
  walletConnectSlot?: ReactNode
  /** Whether to show the Batch button */
  showBatch?: boolean
  /** Batch button callback */
  onBatchClick?: () => void
  /** Number of items in the draft batch (shown as badge) */
  batchCount?: number
}

/**
 * HeaderNavigation component displays navigation actions with icons
 * for search, notifications, and wallet address.
 */
export function HeaderNavigation({
  walletAddress,
  messages = 0,
  showSearch = false,
  onSearchClick,
  onNotificationsClick,
  onWalletClick,
  walletConnectSlot,
  showBatch = false,
  onBatchClick,
  batchCount = 0,
}: HeaderNavigationProps) {
  const truncatedAddress =
    walletAddress.length > 12 ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : walletAddress

  return (
    <div className={cn('flex items-center gap-1')}>
      {/* TODO: Global search button */}
      {showSearch && (
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={onSearchClick}
          className="cursor-pointer shrink-0 rounded-lg bg-card hover:bg-muted/30 transition-colors"
          aria-label="Search"
        >
          <Search className="size-5 text-muted-foreground" />
        </Button>
      )}

      <div className="relative" data-testid="notifications-center">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={onNotificationsClick}
          className="cursor-pointer shrink-0 rounded-lg bg-card hover:bg-muted/30 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-5 text-muted-foreground" />
        </Button>

        {messages > 0 && (
          <span
            className="absolute z-10 flex items-center justify-center rounded-full border-[3px] border-card bg-[var(--color-success-main)] w-[10px] h-[10px] top-[9px] right-[10px]"
            aria-label={`${messages} unread messages`}
          />
        )}
      </div>

      {walletConnectSlot}

      {showBatch && (
        <div className="relative" data-track="batching: Batch sidebar open">
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={onBatchClick}
            className="cursor-pointer shrink-0 rounded-lg bg-card hover:bg-muted/30 transition-colors"
            aria-label="Batch transactions"
          >
            <Layers className="size-5 text-muted-foreground" />
          </Button>

          {batchCount > 0 && (
            <span
              className="absolute z-10 flex items-center justify-center rounded-full border-[3px] border-card bg-[var(--color-success-main)] w-[10px] h-[10px] top-[9px] right-[10px]"
              aria-label={`${batchCount} batched transactions`}
            />
          )}
        </div>
      )}

      <Button
        variant="ghost"
        size="lg"
        onClick={onWalletClick}
        className="cursor-pointer gap-1.5 shrink-0 rounded-lg bg-card hover:bg-muted/30 transition-colors"
        aria-label={`Wallet ${truncatedAddress}`}
        data-testid="connect-wallet-btn"
      >
        <Wallet className="size-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-normal">{truncatedAddress}</span>
      </Button>
    </div>
  )
}
