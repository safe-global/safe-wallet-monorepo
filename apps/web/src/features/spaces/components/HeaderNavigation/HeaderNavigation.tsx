import type { MouseEvent } from 'react'
import { Search, Bell, Wallet } from 'lucide-react'
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
}: HeaderNavigationProps) {
  const truncatedAddress =
    walletAddress.length > 12 ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : walletAddress

  return (
    <div className={cn('flex items-center gap-1.5 rounded-sm bg-background dark:bg-secondary p-[3px]')}>
      {showSearch && (
        <Button
          variant="secondary"
          size="icon-sm"
          onClick={onSearchClick}
          className="cursor-pointer shrink-0"
          aria-label="Search"
        >
          <Search className="size-5" />
        </Button>
      )}

      <div className="relative">
        <Button
          variant="secondary"
          size="icon-lg"
          onClick={onNotificationsClick}
          className="cursor-pointer shrink-0 rounded-sm dark:bg-card"
          aria-label="Notifications"
        >
          <Bell className="size-5 text-muted-foreground" />
        </Button>

        {messages > 0 && (
          <span
            className="absolute z-10 flex items-center justify-center rounded-full border-[3px] border-secondary bg-[var(--color-success-main)] w-[10px] h-[10px] top-[9px] right-[10px]"
            aria-label={`${messages} unread messages`}
          />
        )}
      </div>

      <Button
        variant="secondary"
        size="lg"
        onClick={onWalletClick}
        className="cursor-pointer gap-1.5 shrink-0 rounded-sm dark:bg-card"
        aria-label={`Wallet ${truncatedAddress}`}
      >
        <Wallet className="size-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-normal">{truncatedAddress}</span>
      </Button>
    </div>
  )
}
