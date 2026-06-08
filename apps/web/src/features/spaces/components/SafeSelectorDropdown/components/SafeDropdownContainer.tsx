import { ChevronDown, RotateCw, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SelectContent, SelectItem } from '@/components/ui/select'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import SafeItem from './SafeItem'
import MultiChainSafeItemRow from './MultiChainSafeItemRow'
import type { SafeItemData } from '../types'

// Matches a safe against a lowercased query by its resolved display name, address, or any of its
// chains' names/short names. `displayName` is the same name shown in the row (the safe's own name OR
// its address-book name), so searching also finds safes named only in the address book.
const matchesSearch = (item: SafeItemData, displayName: string, query: string): boolean => {
  const name = displayName.toLowerCase()
  const address = item.address.toLowerCase()
  if (name.includes(query) || address.includes(query)) return true
  return item.chains.some(
    (chain) => chain.chainName?.toLowerCase().includes(query) || chain.shortName?.toLowerCase().includes(query),
  )
}

export interface SafeDropdownContainerProps {
  items: SafeItemData[]
  selectedItemId?: string
  onItemSelect: (itemId: string) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  header?: React.ReactNode
  footer?: React.ReactNode | ((close: () => void) => React.ReactNode)
  closeDropdown: () => void
}

function SafeItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-3.5 w-14 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
      </div>
    </div>
  )
}

function DropdownContentError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8">
      <p className="text-sm font-semibold">Unable to load accounts</p>
      <p className="text-xs text-muted-foreground">Try to reload page.</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RotateCw className="size-3.5" />
          Reload
        </Button>
      )}
    </div>
  )
}

const SKELETON_COUNT = 4

const SafeDropdownContainer = ({
  items,
  selectedItemId,
  isLoading,
  isError,
  onRetry,
  header,
  footer,
  closeDropdown,
}: SafeDropdownContainerProps) => {
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const resolveName = useSafeNameResolver()

  // Multi-chain items stay visible even when currently selected so the user can expand and switch chains.
  const structuralItems = items.filter((item) => item.chains.length > 1 || item.id !== selectedItemId)
  const filteredItems = query
    ? structuralItems.filter((item) =>
        matchesSearch(item, resolveName(item.address, item.chains[0]?.chainId, item.name), query),
      )
    : structuralItems

  const showSearch = !isError && items.length > 0

  const footerRef = useRef<HTMLDivElement>(null)
  const [showScrollHint, setShowScrollHint] = useState(false)

  // Custom scroll hint replaces base-ui's built-in scroll arrows: they sit at `bottom: 0`
  // (colliding with the sticky footer) and don't animate, so users miss that the list is scrollable.
  useEffect(() => {
    const el = footerRef.current
    if (!el) return
    // base-ui's Popup is the scroll container; reach it via the project's `data-slot` marker.
    const scroller = el.closest<HTMLElement>('[data-slot="select-content"]')
    if (!scroller) return

    const update = () => {
      const hasOverflow = scroller.scrollHeight > scroller.clientHeight + 1
      const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1
      setShowScrollHint(hasOverflow && !atBottom)
    }

    update()
    scroller.addEventListener('scroll', update, { passive: true })
    // base-ui sizes the popup async and avatars/logos load late, so the initial
    // measurement often misses the overflow. Observe size changes to catch up.
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(scroller)
    Array.from(scroller.children).forEach((child) => resizeObserver.observe(child))
    return () => {
      scroller.removeEventListener('scroll', update)
      resizeObserver.disconnect()
    }
  }, [filteredItems.length, isLoading, isError])

  const renderContent = () => {
    if (isError) {
      return <DropdownContentError onRetry={onRetry} />
    }

    if (isLoading && filteredItems.length === 0 && !query) {
      return Array.from({ length: SKELETON_COUNT }, (_, i) => <SafeItemSkeleton key={i} />)
    }

    if (filteredItems.length === 0) {
      return (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground" data-testid="dropdown-empty">
          {query ? 'No safes match your search' : 'No safes yet'}
        </p>
      )
    }

    return filteredItems.map((item) => {
      if (item.chains.length > 1) {
        return <MultiChainSafeItemRow key={item.id} item={item} />
      }
      return (
        <SelectItem
          key={item.id}
          value={item.id}
          className="h-auto py-4 px-4 rounded-lg my-1 data-[state=checked]:bg-muted hover:bg-muted/30 cursor-pointer"
        >
          <SafeItem {...item} />
        </SelectItem>
      )
    })
  }

  return (
    <SelectContent
      align="start"
      side="bottom"
      alignItemWithTrigger={false}
      className="w-[430px] max-w-[calc(100vw-2rem)] max-h-[min(34rem,var(--available-height))] overflow-y-auto overscroll-y-none bg-card border-0 ring-0 rounded-lg px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&_[data-slot=select-scroll-down-button]]:hidden [&_[data-slot=select-scroll-up-button]]:hidden"
      sideOffset={20}
      alignOffset={9}
      collisionAvoidance={{ side: 'none', align: 'shift' }}
    >
      {(header || showSearch) && (
        <div className="sticky top-0 z-10 bg-card">
          {header}
          {showSearch && (
            <div className="px-3 pb-2 pt-1">
              <InputGroup className="rounded-md border-gray-100 shadow-none">
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search by name, address or network"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  // Stop keystrokes from reaching base-ui Select's typeahead/navigation handlers on
                  // the popup, which would otherwise hijack typing. This also keeps arrow/Enter keys
                  // in the input (no list navigation from the field); Escape still bubbles to close.
                  onKeyDown={(e) => {
                    if (e.key !== 'Escape') e.stopPropagation()
                  }}
                  autoComplete="off"
                  data-testid="safe-dropdown-search-input"
                />
              </InputGroup>
            </div>
          )}
        </div>
      )}
      {renderContent()}
      {footer && (
        <div ref={footerRef} className="sticky bottom-0 z-10 bg-card">
          {showScrollHint && (
            <ChevronDown
              data-testid="scroll-hint"
              aria-hidden
              className="pointer-events-none absolute -top-3 left-1/2 size-4 -translate-x-1/2 animate-bounce text-muted-foreground"
            />
          )}
          {typeof footer === 'function' ? footer(closeDropdown) : footer}
        </div>
      )}
    </SelectContent>
  )
}

export default SafeDropdownContainer
