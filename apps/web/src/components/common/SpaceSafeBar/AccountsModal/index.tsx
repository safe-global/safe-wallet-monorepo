import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, CircleFadingPlus, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { AppRoutes } from '@/config/routes'
import { useAllSafes, useAllSafesGrouped, isMultiChainSafeItem, type AllSafeItems } from '@/hooks/safes'
import { useOwnersGetAllSafesByOwnerV2Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getFlaggedSimilarAddressSet } from '@safe-global/utils/utils/addressSimilarity'
import { trackEvent } from '@/services/analytics'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import InlineRetryError from '@/components/common/InlineRetryError'
import { SafeListSkeleton } from './shared'
import SafeItemCard from './SafeItemCard'
import MultiSafeItemCard from './MultiSafeItemCard'

interface AccountsModalProps {
  open: boolean
  onClose: () => void
}

const AccountsModal = ({ open, onClose }: AccountsModalProps) => {
  const [search, setSearch] = useState('')
  const dispatch = useAppDispatch()
  const allSafes = useAllSafes()
  const { address: walletAddress = '' } = useWallet() || {}
  const { error: ownedSafesError, refetch: refetchOwnedSafes } = useOwnersGetAllSafesByOwnerV2Query(
    { ownerAddress: walletAddress },
    { skip: walletAddress === '' },
  )

  useEffect(() => {
    if (!open || !ownedSafesError) return
    dispatch(
      showNotification({
        title: 'Failed to load owned safes',
        message: 'Some of your accounts may be missing. Please try again.',
        groupKey: 'owned-safes-fetch-error',
        variant: 'error',
        link: { onClick: () => void refetchOwnedSafes(), title: 'Retry' },
      }),
    )
  }, [open, ownedSafesError, refetchOwnedSafes, dispatch])

  // Group ALL safes into single/multi-chain
  const { allSingleSafes, allMultiChainSafes } = useAllSafesGrouped(allSafes ?? [])

  // Merge into ordered list (multi-chain first by lastVisited, then single)
  const allItems = useMemo<AllSafeItems>(() => {
    const multi = allMultiChainSafes ?? []
    const single = allSingleSafes ?? []
    return [...multi, ...single].sort((a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0))
  }, [allMultiChainSafes, allSingleSafes])

  const similarAddresses = useMemo(() => getFlaggedSimilarAddressSet(allItems.map((item) => item.address)), [allItems])

  // Apply search filter
  const filteredItems = useMemo(() => {
    if (!search.trim()) return allItems
    const query = search.toLowerCase()
    return allItems.filter((item) => {
      const name = item.name?.toLowerCase() ?? ''
      const address = item.address.toLowerCase()
      return name.includes(query) || address.includes(query)
    })
  }, [allItems, search])

  // Split into trusted and other
  const trustedItems = useMemo(() => filteredItems.filter((item) => item.isPinned), [filteredItems])
  const otherItems = useMemo(() => filteredItems.filter((item) => !item.isPinned), [filteredItems])

  // Track search with debounce
  const searchTracked = useRef(false)
  useEffect(() => {
    if (!search.trim()) {
      searchTracked.current = false
      return
    }
    if (searchTracked.current) return
    const timer = setTimeout(() => {
      trackEvent(OVERVIEW_EVENTS.SEARCH)
      searchTracked.current = true
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  if (!open) return null

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton className="flex max-h-[90vh] w-full max-w-[560px] flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border/50 px-4 pb-3 pt-4">
          <DialogTitle>All Accounts</DialogTitle>
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
            />
          </InputGroup>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
          {ownedSafesError && (
            <div className="px-2 pb-2 pt-1">
              <InlineRetryError message="Failed to load owned safes" onRetry={refetchOwnedSafes} />
            </div>
          )}
          {!allSafes ? (
            <SafeListSkeleton />
          ) : filteredItems.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {search.trim() ? 'No safes match your search' : 'No safes yet'}
            </p>
          ) : (
            <>
              {trustedItems.length > 0 && (
                <>
                  <div className="flex items-center gap-1.5 px-2 pb-1 pt-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Trusted Safes
                    </span>
                  </div>
                  {trustedItems.map((item) =>
                    isMultiChainSafeItem(item) ? (
                      <MultiSafeItemCard
                        key={item.address}
                        item={item}
                        isSimilar={similarAddresses.has(item.address.toLowerCase())}
                        onClose={onClose}
                      />
                    ) : (
                      <SafeItemCard
                        key={`${item.chainId}:${item.address}`}
                        safeItem={item}
                        isSimilar={similarAddresses.has(item.address.toLowerCase())}
                        onClose={onClose}
                      />
                    ),
                  )}
                </>
              )}

              {otherItems.length > 0 && (
                <>
                  <div className="flex items-center gap-1.5 px-2 pb-1 pt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Other Safes
                    </span>
                  </div>
                  {otherItems.map((item) =>
                    isMultiChainSafeItem(item) ? (
                      <MultiSafeItemCard
                        key={item.address}
                        item={item}
                        isSimilar={similarAddresses.has(item.address.toLowerCase())}
                        onClose={onClose}
                      />
                    ) : (
                      <SafeItemCard
                        key={`${item.chainId}:${item.address}`}
                        safeItem={item}
                        isSimilar={similarAddresses.has(item.address.toLowerCase())}
                        onClose={onClose}
                      />
                    ),
                  )}
                </>
              )}
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
