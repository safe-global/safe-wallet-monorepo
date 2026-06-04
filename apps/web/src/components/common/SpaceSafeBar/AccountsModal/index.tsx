import { useState } from 'react'
import Link from 'next/link'
import { Search, CircleFadingPlus, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { AppRoutes } from '@/config/routes'
import { isMultiChainSafeItem } from '@/hooks/safes'
import { trackEvent } from '@/services/analytics'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import InlineRetryError from '@/components/common/InlineRetryError'
import { SafeListSkeleton } from './shared'
import SimilarAddressAlert from '@/components/common/SimilarAddressAlert'
import SafeItemCard from './SafeItemCard'
import MultiSafeItemCard from './MultiSafeItemCard'
import { useAccountsModalItems } from './useAccountsModalItems'
import type { AllSafeItems } from '@/hooks/safes'

interface AccountsModalProps {
  open: boolean
  onClose: () => void
}

interface SectionOptions {
  similarAddresses: Set<string>
  onClose: () => void
  hidePinControls: boolean
  headerPaddingTopClass: string
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
            hidePinControls={opts.hidePinControls}
          />
        ) : (
          <SafeItemCard
            key={`${item.chainId}:${item.address}`}
            safeItem={item}
            isSimilar={opts.similarAddresses.has(item.address.toLowerCase())}
            onClose={opts.onClose}
            hidePinControls={opts.hidePinControls}
          />
        ),
      )}
    </>
  )
}

const AccountsModal = ({ open, onClose }: AccountsModalProps) => {
  const [search, setSearch] = useState('')
  const {
    trustedItems,
    otherItems,
    similarAddresses,
    isLoading,
    isOwnedSafesError,
    refetchOwnedSafes,
    isQualifiedSafe,
  } = useAccountsModalItems({ search, open })

  if (!open) return null

  const isEmpty = trustedItems.length === 0 && otherItems.length === 0

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
                hidePinControls: isQualifiedSafe,
                headerPaddingTopClass: 'pt-1',
                headerTestId: 'pinned-accounts',
              })}
              {renderSection('Other Safes', otherItems, {
                similarAddresses,
                onClose,
                hidePinControls: isQualifiedSafe,
                headerPaddingTopClass: 'pt-2',
              })}
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-row gap-2 border-t border-border/50 px-4 py-3">
          <Button
            render={
              <Link
                href={AppRoutes.newSafe.load}
                onClick={() => {
                  trackEvent({ ...OVERVIEW_EVENTS.ADD_TO_WATCHLIST, label: OVERVIEW_LABELS.top_bar })
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
                href={AppRoutes.newSafe.create}
                onClick={() => {
                  trackEvent({ ...OVERVIEW_EVENTS.CREATE_NEW_SAFE, label: OVERVIEW_LABELS.top_bar })
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
