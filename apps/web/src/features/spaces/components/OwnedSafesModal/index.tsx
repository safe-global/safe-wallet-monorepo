import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, CircleFadingPlus, Plus, Wallet } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { AppRoutes } from '@/config/routes'
import {
  _getMultiChainAccounts,
  _getSingleChainAccounts,
  useSafeItemBuilder,
  type AllSafeItems,
  type SafeItem,
  isMultiChainSafeItem,
} from '@/hooks/safes'
import useChains from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectUndeployedSafes } from '@/store/slices'
import { getFlaggedSimilarAddressSet } from '@safe-global/utils/utils/addressSimilarity'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { trackEvent } from '@/services/analytics'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { Typography } from '@/components/ui/typography'
import SafeItemCard from '@/components/common/SpaceSafeBar/AccountsModal/SafeItemCard'
import MultiSafeItemCard from '@/components/common/SpaceSafeBar/AccountsModal/MultiSafeItemCard'
import { SafeListSkeleton } from '@/components/common/SpaceSafeBar/AccountsModal/shared'

interface OwnedSafesModalProps {
  open: boolean
  onClose: () => void
}

const OwnedSafesModal = ({ open, onClose }: OwnedSafesModalProps) => {
  const [search, setSearch] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const connectWallet = useConnectWallet()

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    try {
      await connectWallet()
    } finally {
      setIsConnecting(false)
    }
  }

  const { buildSafeItem, walletAddress, isWalletConnected, allOwned, ownedError, ownedLoading } = useSafeItemBuilder()
  const allUndeployed = useAppSelector(selectUndeployedSafes)

  const { configs } = useChains()
  const allChainIds = useMemo(() => configs.map((c) => c.chainId), [configs])

  const ownedItems = useMemo<SafeItem[]>(() => {
    if (!isWalletConnected) return []

    return allChainIds.flatMap((chainId) => {
      const deployedOwned = allOwned[chainId] ?? []

      const undeployedOwned = Object.entries(allUndeployed[chainId] ?? {})
        .filter(([, undeployed]) => {
          const owners = undeployed?.props?.safeAccountConfig?.owners ?? []
          return owners.some((owner) => sameAddress(owner, walletAddress))
        })
        .map(([address]) => address)

      const merged = Array.from(new Set([...deployedOwned, ...undeployedOwned]))
      return merged.map((address) => buildSafeItem(chainId, address))
    })
  }, [isWalletConnected, walletAddress, allChainIds, allOwned, allUndeployed, buildSafeItem])

  const allItems = useMemo<AllSafeItems>(() => {
    const multi = _getMultiChainAccounts(ownedItems)
    const single = _getSingleChainAccounts(ownedItems, multi)
    return [...multi, ...single].sort((a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0))
  }, [ownedItems])

  const similarAddresses = useMemo(() => getFlaggedSimilarAddressSet(allItems.map((item) => item.address)), [allItems])

  const filteredItems = useMemo(() => {
    if (!search.trim()) return allItems
    const query = search.toLowerCase()
    return allItems.filter((item) => {
      const name = item.name?.toLowerCase() ?? ''
      const address = item.address.toLowerCase()
      return name.includes(query) || address.includes(query)
    })
  }, [allItems, search])

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
  if (isConnecting) return null

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton
        data-owned-safes-modal
        className="flex max-h-[90vh] w-full max-w-[560px] flex-col gap-0 p-0 dark:border dark:border-border"
      >
        <DialogHeader className="shrink-0 border-b border-border/50 px-4 pb-3 pt-4">
          <DialogTitle className="font-bold">Owned Safe accounts</DialogTitle>
        </DialogHeader>

        {isWalletConnected && (
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
                data-testid="owned-safes-search-input"
              />
            </InputGroup>
          </div>
        )}

        <div
          className="min-h-0 flex-1 overflow-y-auto px-3 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
          data-testid="owned-safes-list"
        >
          {!isWalletConnected ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Wallet className="size-12 text-muted-foreground" />
              <Typography variant="paragraph" align="center" color="muted">
                Connect your wallet to access all your Safes
              </Typography>
              <Button
                data-testid="owned-safes-connect-wallet-button"
                type="button"
                size="lg"
                className="w-full max-w-[300px]"
                onClick={handleConnectWallet}
              >
                Connect wallet
              </Button>
            </div>
          ) : ownedError && allItems.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-destructive">Failed to load owned safes.</p>
          ) : ownedLoading && allItems.length === 0 ? (
            <SafeListSkeleton />
          ) : filteredItems.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground" data-testid="owned-safes-empty">
              {search.trim() ? 'No safes match your search' : 'No owned Safe accounts yet'}
            </p>
          ) : (
            filteredItems.map((item) =>
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
            )
          )}
        </div>

        {isWalletConnected && (
          <DialogFooter className="shrink-0 flex-row gap-2 border-t border-border/50 px-4 py-3">
            <Button
              render={
                <Link
                  href={AppRoutes.newSafe.load}
                  onClick={() => {
                    trackEvent({ ...OVERVIEW_EVENTS.ADD_TO_WATCHLIST, label: OVERVIEW_LABELS.owned_safes_modal })
                    onClose()
                  }}
                />
              }
              variant="secondary"
              size="lg"
              className="flex-1"
              data-testid="owned-safes-add-existing"
            >
              <CircleFadingPlus className="size-4" />
              Add existing
            </Button>
            <Button
              render={
                <Link
                  href={AppRoutes.newSafe.create}
                  onClick={() => {
                    trackEvent({ ...OVERVIEW_EVENTS.CREATE_NEW_SAFE, label: OVERVIEW_LABELS.owned_safes_modal })
                    onClose()
                  }}
                />
              }
              variant="default"
              size="lg"
              className="flex-1"
              data-testid="owned-safes-create-new"
            >
              <Plus className="size-4 text-green-500" />
              Create new
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default OwnedSafesModal
