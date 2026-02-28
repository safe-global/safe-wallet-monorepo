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
  onNotificationsClick?: () => void
  /**
   * Callback when wallet button is clicked
   */
  onWalletClick?: () => void
}

/**
 * HeaderNavigation component displays navigation actions with icons
 * for search, notifications, and wallet address.
 */
export function HeaderNavigation({
  walletAddress: walletAddress,
  messages = 0,
  showSearch = false,
  onSearchClick,
  onNotificationsClick,
  onWalletClick,
}: HeaderNavigationProps) {
  const truncatedAddress =
    walletAddress.length > 12 ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : walletAddress

  return (
    <div className={cn('flex items-center gap-1.5 rounded-lg bg-background p-[3px]')}>
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
          size="icon-sm"
          onClick={onNotificationsClick}
          className="cursor-pointer shrink-0"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </Button>

        {messages > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 z-10 flex size-2 items-center justify-center rounded-full border border-background bg-[#4ADE80]"
            aria-label={`${messages} unread messages`}
          />
        )}
      </div>

      <Button
        variant="secondary"
        size="default"
        onClick={onWalletClick}
        className="cursor-pointer gap-1.5 shrink-0 h-9"
        aria-label={`Wallet ${truncatedAddress}`}
      >
        <Wallet className="size-5" />
        <span className="text-xs text-muted-foreground font-normal">{truncatedAddress}</span>
      </Button>
    </div>
  )
}
