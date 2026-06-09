import { RotateCw, Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SelectContent, SelectItem } from '@/components/ui/select'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import SafeItem from './SafeItem'
import MultiChainSafeItemRow from './MultiChainSafeItemRow'
import type { SafeItemData } from '../types'

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

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const detachScrollRef = useRef<(() => void) | null>(null)
  const [showScrollHint, setShowScrollHint] = useState(false)

  // Bottom-fade scroll hint, shown only while more rows lie below the fold.
  const measureScrollHint = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const hasOverflow = el.scrollHeight > el.clientHeight + 1
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
    setShowScrollHint(hasOverflow && !atBottom)
  }, [])

  // Callback ref so the listeners/observer always bind to the LIVE scroll node. base-ui can remount
  // the popup content after it sizes the popup async; a plain effect (deps unchanged) would stay
  // closed over a stale, detached node and leave the hint stuck off. Re-measure next frame too.
  const attachScrollArea = useCallback(
    (node: HTMLDivElement | null) => {
      detachScrollRef.current?.()
      detachScrollRef.current = null
      scrollRef.current = node
      if (!node) return
      node.addEventListener('scroll', measureScrollHint, { passive: true })
      const resizeObserver = new ResizeObserver(measureScrollHint)
      resizeObserver.observe(node)
      Array.from(node.children).forEach((child) => resizeObserver.observe(child))
      measureScrollHint()
      const raf = requestAnimationFrame(measureScrollHint)
      detachScrollRef.current = () => {
        cancelAnimationFrame(raf)
        node.removeEventListener('scroll', measureScrollHint)
        resizeObserver.disconnect()
      }
    },
    [measureScrollHint],
  )

  // Re-measure when the rendered rows change (the scroll node itself can stay the same).
  useEffect(() => {
    measureScrollHint()
    const raf = requestAnimationFrame(measureScrollHint)
    return () => cancelAnimationFrame(raf)
  }, [filteredItems.length, isLoading, isError, measureScrollHint])

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
      // outline-hidden: base-ui focuses the popup on open; typing in the search field makes that
      // :focus-visible and would otherwise draw the browser's blue outline around the whole popup.
      className="w-[430px] max-w-[calc(100vw-2rem)] overflow-hidden bg-card border-0 ring-0 outline-hidden rounded-lg [&_[data-slot=select-scroll-down-button]]:hidden [&_[data-slot=select-scroll-up-button]]:hidden"
      sideOffset={20}
      alignOffset={9}
      collisionAvoidance={{ side: 'none', align: 'shift' }}
    >
      {/* Fallback to 34rem: until base-ui sets --available-height the clamp must still apply, else the
          list expands to full height, measures as non-overflowing, and the scroll-hint fade is missed. */}
      <div className="flex max-h-[min(34rem,var(--available-height,34rem))] flex-col">
        {(header || showSearch) && (
          <div className="shrink-0 bg-card">
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
                    // Stop keystrokes reaching base-ui Select's typeahead, which would hijack typing.
                    // Trade-off: arrows/Enter stay in the input (no list nav); Escape still closes.
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

        <div
          ref={attachScrollArea}
          data-testid="dropdown-scroll-area"
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-none px-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
        >
          {renderContent()}
        </div>

        {footer && (
          <div className="relative shrink-0 bg-card">
            {showScrollHint && (
              <div
                data-testid="scroll-hint"
                aria-hidden
                // Fade the last visible row into the dropdown background. `card` isn't a :root color
                // token (so `to-card` renders transparent) — reference the paper var it resolves to.
                className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-gradient-to-b from-transparent to-[var(--color-background-paper)]"
              />
            )}
            {typeof footer === 'function' ? footer(closeDropdown) : footer}
          </div>
        )}
      </div>
    </SelectContent>
  )
}

export default SafeDropdownContainer
