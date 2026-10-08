import type { MouseEvent, ReactNode } from 'react'
import { useMemo } from 'react'
import { blo } from 'blo'
import { isAddress } from 'ethers'
import { BatchTooltip } from '@/features/batching'
import { HeaderNavigationView } from '@views/features/spaces/components/HeaderNavigation/HeaderNavigationView'

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
    <HeaderNavigationView
      walletAddress={walletAddress}
      walletEns={walletEns}
      isConnected={isConnected}
      identiconUrl={identiconUrl}
      providerIconSrc={providerIconSrc}
      walletLabel={walletLabel}
      messages={messages}
      showSearch={showSearch}
      onSearchClick={onSearchClick}
      onNotificationsClick={onNotificationsClick}
      onWalletClick={onWalletClick}
      walletConnectSlot={walletConnectSlot}
      showBatch={showBatch}
      onBatchClick={onBatchClick}
      batchCount={batchCount}
      renderBatchTooltip={(children) => <BatchTooltip>{children}</BatchTooltip>}
    />
  )
}
