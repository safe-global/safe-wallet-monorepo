import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Bookmark, CircleFadingPlus, Plus, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { AppRoutes } from '@/config/routes'
import { useAllSafes, useAllSafesGrouped, isMultiChainSafeItem, type AllSafeItems } from '@/hooks/safes'
import PinnedSafeItem from './PinnedSafeItem'
import PinnedMultiSafeItem from './PinnedMultiSafeItem'

interface AccountsModalProps {
  open: boolean
  onClose: () => void
  onManage: () => void
}

const AccountsModal = ({ open, onClose, onManage }: AccountsModalProps) => {
  const [search, setSearch] = useState('')
  const allSafes = useAllSafes()

  // Filter to pinned only, then group into single/multi-chain
  const pinnedFlat = useMemo(() => allSafes?.filter((s) => s.isPinned) ?? [], [allSafes])
  const { allSingleSafes, allMultiChainSafes } = useAllSafesGrouped(pinnedFlat)

  // Merge into ordered list (multi-chain first by lastVisited, then single)
  const allItems = useMemo<AllSafeItems>(() => {
    const multi = allMultiChainSafes ?? []
    const single = allSingleSafes ?? []
    return [...multi, ...single].sort((a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0))
  }, [allMultiChainSafes, allSingleSafes])

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

  const handleManage = () => {
    onClose()
    onManage()
  }

  if (!open) return null

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent showCloseButton className="flex max-h-[90vh] w-full max-w-[560px] flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border/50 px-4 pb-3 pt-4">
          <DialogTitle>Accounts</DialogTitle>
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
          <div className="flex items-center gap-1.5 px-2 pb-1 pt-1">
            <Bookmark className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trusted Safes</span>
            <button
              type="button"
              onClick={handleManage}
              className="ml-auto flex cursor-pointer items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Manage
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          {filteredItems.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {search.trim() ? 'No safes match your search' : 'No trusted safes yet'}
            </p>
          ) : (
            filteredItems.map((item) =>
              isMultiChainSafeItem(item) ? (
                <PinnedMultiSafeItem key={item.address} item={item} onNavigate={onClose} />
              ) : (
                <PinnedSafeItem key={`${item.chainId}:${item.address}`} safeItem={item} onNavigate={onClose} />
              ),
            )
          )}
        </div>

        <DialogFooter className="shrink-0 flex-row gap-2 border-t border-border/50 px-4 py-3">
          <Button
            render={<Link href={AppRoutes.newSafe.load} onClick={onClose} />}
            variant="secondary"
            size="lg"
            className="flex-1"
          >
            <CircleFadingPlus className="size-4" />
            Add existing
          </Button>
          <Button
            render={<Link href={AppRoutes.newSafe.create} onClick={onClose} />}
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
