import type { MouseEvent, ReactNode } from 'react'
import { useMemo } from 'react'
import { Search, Bell, Wallet, Layers, ChevronUp, ChevronDown } from 'lucide-react'
import { blo } from 'blo'
import { isAddress } from 'ethers'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, BATCH_EVENTS } from '@/services/analytics'
import { BatchTooltip } from '@/features/batching'

export interface HeaderNavigationProps {
  /**
   * Wallet address to display (will be truncated)
   */
  walletAddress: string
  /**
   * ENS name to display instead of truncated address
   */
  walletEns?: string
  /**
   * Whether a wallet is connected
   */
  isConnected?: boolean
  /**
   * Wallet provider icon (SVG string or data URI from onboard)
   */
  walletIcon?: string
  /**
   * Wallet provider label (e.g. "MetaMask", "WalletConnect")
   */
  walletLabel?: string
  /**
   * Whether the wallet popover is open (controls chevron direction)
   */
  walletOpen?: boolean
  /**
   * Number of unread messages
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
  walletEns,
  isConnected = false,
  walletIcon,
  walletLabel,
  walletOpen = false,
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

  const walletDisplayName = walletEns || truncatedAddress

  const identiconUrl = useMemo(() => {
    try {
      if (walletAddress && isAddress(walletAddress)) {
        return blo(walletAddress as `0x${string}`)
      }
    } catch {
      // ignore
    }
    return null
  }, [walletAddress])

  const providerIconSrc = useMemo(() => {
    if (!walletIcon) return null
    return walletIcon.startsWith('data:') ? walletIcon : `data:image/svg+xml;utf8,${encodeURIComponent(walletIcon)}`
  }, [walletIcon])

  return (
    <div className={cn('flex items-center gap-1')}>
      {/* TODO: Global search button */}
      {showSearch && (
        <div className="flex self-stretch items-stretch rounded-lg bg-card shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSearchClick}
            className="cursor-pointer rounded-lg bg-transparent hover:bg-muted/30 transition-colors m-1"
            aria-label="Search"
          >
            <Search className="size-5 text-muted-foreground" />
          </Button>
        </div>
      )}

      <div
        className="relative flex self-stretch items-stretch rounded-lg bg-card shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]"
        data-testid="notifications-center"
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onNotificationsClick}
          className="cursor-pointer rounded-lg bg-transparent hover:bg-muted/30 transition-colors m-1"
          aria-label="Notifications"
        >
          <Bell className="size-5 text-muted-foreground" />
        </Button>

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

      {showBatch && (
        <BatchTooltip>
          <Track {...BATCH_EVENTS.BATCH_SIDEBAR_OPEN} label={batchCount}>
            <div
              className="relative flex self-stretch items-stretch rounded-lg bg-card shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]"
              data-track="batching: Batch sidebar open"
            >
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onBatchClick}
                className="cursor-pointer rounded-lg bg-transparent hover:bg-muted/30 transition-colors m-1"
                aria-label="Batch transactions"
              >
                <Layers className="size-5 text-muted-foreground" />
              </Button>

              {batchCount > 0 && (
                <span
                  className="absolute z-10 flex items-center justify-center rounded-full bg-[rgba(18,255,128,0.1)] text-[10px] font-medium leading-none text-secondary-foreground min-w-[18px] h-[18px] px-1 -top-[2px] -right-[4px]"
                  aria-label={`${batchCount} batched transactions`}
                >
                  {batchCount > 99 ? '99+' : batchCount}
                </span>
              )}
            </div>
          </Track>
        </BatchTooltip>
      )}

      <Track label={OVERVIEW_LABELS.top_bar} {...OVERVIEW_EVENTS.OPEN_ONBOARD}>
        <div className="flex self-stretch items-stretch rounded-lg bg-card shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={onWalletClick}
            className="cursor-pointer gap-1.5 rounded-lg bg-transparent hover:bg-muted/30 transition-colors m-1"
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
              <Wallet className="size-5 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground font-normal">
              {isConnected ? walletDisplayName : 'Connect Wallet'}
            </span>
            {isConnected &&
              (walletOpen ? (
                <ChevronUp className="size-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-3.5 text-muted-foreground" />
              ))}
          </Button>
        </div>
      </Track>
    </div>
  )
}
