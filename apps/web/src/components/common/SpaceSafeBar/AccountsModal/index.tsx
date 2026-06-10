import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Search, CircleFadingPlus, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { AppRoutes } from '@/config/routes'
import { buildCurrentNextUrl } from '@/utils/nextUrl'
import { isMultiChainSafeItem } from '@/hooks/safes'
import { trackEvent } from '@/services/analytics'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import InlineRetryError from '@/components/common/InlineRetryError'
import { SafeListSkeleton } from './shared'
import SimilarAddressAlert from '@/components/common/SimilarAddressAlert'
import ConnectWalletHint from '@/features/spaces/components/ConnectWalletHint'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import SafeItemCard from './SafeItemCard'
import MultiSafeItemCard from './MultiSafeItemCard'
import { useAccountsModalItems } from './useAccountsModalItems'
import type { AllSafeItems } from '@/hooks/safes'

interface AccountsModalProps {
  open: boolean
  onClose: () => void
  /** Analytics label for footer + open-safe events. Distinguishes the entry point (top bar vs. owned-safes modal). */
  trackingLabel?: OVERVIEW_LABELS
}

interface SectionOptions {
  similarAddresses: Set<string>
  onClose: () => void
  headerPaddingTopClass: string
  openSafeTrackingLabel: OVERVIEW_LABELS
  headerTestId?: string
}

const renderSection = (title: string, items: AllSafeItems, opts: SectionOptions) => {
  if (items.length === 0) return null
  return (
    <>
      <div
        className={`flex items-center gap-1.5 px-2 pb-1 ${opts.headerPaddingTopClass}`}
        data-testid={opts.headerTestId}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      {items.map((item) =>
        isMultiChainSafeItem(item) ? (
          <MultiSafeItemCard
            key={item.address}
            item={item}
            isSimilar={opts.similarAddresses.has(item.address.toLowerCase())}
            onClose={opts.onClose}
            openSafeTrackingLabel={opts.openSafeTrackingLabel}
          />
        ) : (
          <SafeItemCard
            key={`${item.chainId}:${item.address}`}
            safeItem={item}
            isSimilar={opts.similarAddresses.has(item.address.toLowerCase())}
            onClose={opts.onClose}
            openSafeTrackingLabel={opts.openSafeTrackingLabel}
          />
        ),
      )}
    </>
  )
}

const AccountsModal = ({ open, onClose, trackingLabel = OVERVIEW_LABELS.top_bar }: AccountsModalProps) => {
  const [search, setSearch] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const wallet = useWallet()
  const isWalletConnected = Boolean(wallet)
  const connectWallet = useConnectWallet()
  const router = useRouter()
  const {
    trustedItems,
    otherItems,
    similarAddresses,
    isLoading,
    isOwnedSafesError,
    refetchOwnedSafes,
    isQualifiedSafe,
  } = useAccountsModalItems({ search, open })

  // Unmount the dialog while the wallet-connect modal is open: the shadcn Dialog
  // stacks above web3-onboard's connect modal, so hiding it lets the connect
  // window come to the front. The dialog re-renders once connecting resolves.
  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await connectWallet()
    } finally {
      setIsConnecting(false)
    }
  }

  if (!open || isConnecting) return null

  const isEmpty = trustedItems.length === 0 && otherItems.length === 0

  // Round-trip the originating page so Cancel/Back in the new-safe flow returns here.
  const next = buildCurrentNextUrl(router.pathname, router.query)

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton className="flex max-h-[90vh] w-full max-w-[560px] flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border/50 px-4 pb-3 pt-4">
          <DialogTitle>{isQualifiedSafe ? 'Explore other Safes' : 'All Accounts'}</DialogTitle>
        </DialogHeader>

        <div className="shrink-0 px-4 py-3">
          <InputGroup className="rounded-md border-gray-100 shadow-none">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by name or address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              data-testid="accounts-search-input"
            />
          </InputGroup>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-3 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
          data-testid="accounts-list"
        >
          {!isWalletConnected && (
            <div className="px-2 pb-2 pt-1">
              <ConnectWalletHint testId="accounts-connect-wallet-button" onConnect={handleConnect} />
            </div>
          )}
          {isOwnedSafesError && (
            <div className="px-2 pb-2 pt-1">
              <InlineRetryError message="Failed to load owned safes" onRetry={refetchOwnedSafes} />
            </div>
          )}
          {isLoading ? (
            <SafeListSkeleton />
          ) : isEmpty ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground" data-testid="empty-pinned-list">
              {search.trim() ? 'No safes match your search' : 'No safes yet'}
            </p>
          ) : (
            <>
              {similarAddresses.size > 0 && (
                <div className="px-2 pb-2 pt-1">
                  <SimilarAddressAlert />
                </div>
              )}
              {renderSection('Trusted Safes', trustedItems, {
                similarAddresses,
                onClose,
                headerPaddingTopClass: 'pt-1',
                openSafeTrackingLabel: trackingLabel,
                headerTestId: 'pinned-accounts',
              })}
              {renderSection('Other Safes', otherItems, {
                similarAddresses,
                onClose,
                headerPaddingTopClass: 'pt-2',
                openSafeTrackingLabel: trackingLabel,
              })}
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-row gap-2 border-t border-border/50 px-4 py-3">
          <Button
            render={
              <Link
                href={{ pathname: AppRoutes.newSafe.load, query: { next } }}
                onClick={() => {
                  trackEvent({ ...OVERVIEW_EVENTS.ADD_TO_WATCHLIST, label: trackingLabel })
                  onClose()
                }}
              />
            }
            variant="secondary"
            size="lg"
            className="flex-1"
            data-testid="add-safe-button"
          >
            <CircleFadingPlus className="size-4" />
            Add existing
          </Button>
          <Button
            render={
              <Link
                href={{ pathname: AppRoutes.newSafe.create, query: { next } }}
                onClick={() => {
                  trackEvent({ ...OVERVIEW_EVENTS.CREATE_NEW_SAFE, label: trackingLabel })
                  onClose()
                }}
              />
            }
            variant="default"
            size="lg"
            className="flex-1"
          >
            <Plus className="size-4 text-green-500" />
            Create new
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AccountsModal
