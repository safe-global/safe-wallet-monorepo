import { RotateCw, Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SelectContent, SelectItem } from '@/components/ui/select'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import { useBottomScrollFade } from '@/hooks/useBottomScrollFade'
import useWallet from '@/hooks/wallets/useWallet'
import SafeItem from './SafeItem'
import MultiChainSafeItemRow from './MultiChainSafeItemRow'
import ReorderableSafeList from './ReorderableSafeList'
import SafeListSortToggle from '@/components/common/SafeListSortToggle'
import { matchesSafeSearch } from '../utils'
import type { SafeItemData, SafeRenameTarget } from '../types'

export interface SafeDropdownContainerProps {
  items: SafeItemData[]
  selectedItemId?: string
  onItemSelect: (itemId: string) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  header?: React.ReactNode
  footer?: React.ReactNode | ((close: () => void) => React.ReactNode)
  /**
   * Replaces the empty text when the tab has no safes at all — e.g. a "Sign in to a workspace" CTA.
   * A function form receives `closeDropdown` so its actions can dismiss the popup first.
   */
  emptyStateOverride?: React.ReactNode | ((close: () => void) => React.ReactNode)
  closeDropdown: () => void
  /** Controlled search query; falls back to local state when omitted. */
  searchValue?: string
  onSearchValueChange?: (value: string) => void
  /** Enables the rename pencil on rows. The dropdown stays open behind the rename dialog. */
  onItemRename?: (target: SafeRenameTarget) => void
  /**
   * Enables drag-to-reorder for the list (only passed under Manual sort). Fired on drop with the
   * reordered top-level addresses, in display order.
   */
  onReorder?: (orderedAddresses: string[]) => void
}

function SafeItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
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
  onItemSelect,
  isLoading,
  isError,
  onRetry,
  header,
  footer,
  emptyStateOverride,
  closeDropdown,
  searchValue,
  onSearchValueChange,
  onItemRename,
  onReorder,
}: SafeDropdownContainerProps) => {
  const [internalSearch, setInternalSearch] = useState('')
  const search = searchValue ?? internalSearch
  const setSearch = onSearchValueChange ?? setInternalSearch
  const query = search.trim().toLowerCase()
  const resolveName = useSafeNameResolver()
  const wallet = useWallet()

  // The dropdown stays open behind the rename dialog (layered above it via z-index), so the user
  // keeps their place in the list. See SafeSelectorDropdown's `keepOpen`.
  const handleRename = onItemRename

  // The currently-open safe stays in the list (highlighted via its checked/selected state) so the
  // user can locate it among the others.
  const filteredItems = query
    ? items.filter((item) =>
        matchesSafeSearch(item, resolveName(item.address, item.chains[0]?.chainId, item.name), query),
      )
    : items

  // A controlled search spans both tabs, so it stays visible even when the active tab has no rows.
  const showSearch = !isError && (searchValue !== undefined || items.length > 0)

  // Bottom-fade scroll hint, shown only while more rows lie below the fold.
  const { setScrollNode, showFade: showScrollHint } = useBottomScrollFade([filteredItems.length, isLoading, isError])

  // Keep our own handle on the scroll area (shared with the fade hint) so we can scroll the
  // current safe into view on open — under Name / Manual order it can sit mid-list.
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const attachScrollArea = useCallback(
    (node: HTMLDivElement | null) => {
      scrollAreaRef.current = node
      setScrollNode(node)
    },
    [setScrollNode],
  )

  useEffect(() => {
    if (!selectedItemId || isLoading || query) return
    const current = scrollAreaRef.current?.querySelector<HTMLElement>('[data-current-safe="true"]')
    current?.scrollIntoView?.({ block: 'center' })
  }, [selectedItemId, isLoading, query, items.length])

  const renderContent = () => {
    if (isError) {
      return <DropdownContentError onRetry={onRetry} />
    }

    if (isLoading && filteredItems.length === 0 && !query) {
      return Array.from({ length: SKELETON_COUNT }, (_, i) => <SafeItemSkeleton key={i} />)
    }

    if (filteredItems.length === 0) {
      // With no safes to search through at all, "no matches" would be misleading — keep the
      // tab's CTA (sign in to a workspace / connect a wallet) even while a query is typed.
      if (emptyStateOverride && items.length === 0) {
        return (
          <div data-testid="dropdown-empty-override">
            {typeof emptyStateOverride === 'function' ? emptyStateOverride(closeDropdown) : emptyStateOverride}
          </div>
        )
      }
      return (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground" data-testid="dropdown-empty">
          {query
            ? 'No safes match your search'
            : wallet
              ? 'No safes yet'
              : 'Connect a wallet to find your Safe accounts'}
        </p>
      )
    }

    // Manual sort turns the list into a drag-to-reorder list (never while searching — a drop would
    // persist a partial order). Selecting a row navigates and closes, mirroring the Select rows.
    if (onReorder && !query) {
      return (
        <ReorderableSafeList
          items={filteredItems}
          selectedItemId={selectedItemId}
          onSelect={(itemId) => {
            onItemSelect?.(itemId)
            closeDropdown()
          }}
          onRename={handleRename}
          onReorder={onReorder}
        />
      )
    }

    return filteredItems.map((item) => {
      if (item.chains.length > 1) {
        return (
          <MultiChainSafeItemRow
            key={item.id}
            item={item}
            onRename={handleRename}
            isSelected={item.id === selectedItemId}
          />
        )
      }
      return (
        <SelectItem
          key={item.id}
          value={item.id}
          // Scroll anchor for the open-to-current-safe behaviour (see the scrollIntoView effect).
          data-current-safe={item.id === selectedItemId ? 'true' : undefined}
          // [&>div]:min-w-0/shrink relax the built-in ItemText wrapper (shrink-0, min-width:auto in
          // ui/select.tsx) so the name column can truncate instead of overflowing the popup.
          // base-ui moves DOM focus to the hovered/keyboard-active row, so `focus:bg-muted` is the grey
          // hover highlight (it also overrides ui/select's base `focus:bg-accent`); `data-selected`
          // marks the open safe with a subtle green highlight, persistent while it isn't focused.
          // [&>span.absolute]:hidden suppresses the built-in checkmark on the selected row (it
          // overlaps the balance column); the green highlight marks the current safe instead.
          className="group/row h-auto py-3 px-3 rounded-lg my-0.5 cursor-pointer focus:bg-muted data-[selected]:bg-[var(--color-background-light)] [&>div]:min-w-0 [&>div]:shrink [&>span.absolute]:hidden"
        >
          <SafeItem {...item} onRename={handleRename} />
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
      className="w-[543px] max-w-[calc(100vw-2rem)] overflow-hidden bg-card border-0 ring-0 outline-hidden rounded-2xl [&_[data-slot=select-scroll-down-button]]:hidden [&_[data-slot=select-scroll-up-button]]:hidden"
      sideOffset={20}
      alignOffset={9}
      collisionAvoidance={{ side: 'none', align: 'shift' }}
    >
      {/* Fallback to 44rem: until base-ui sets --available-height the clamp must still apply, else the
          list expands to full height, measures as non-overflowing, and the scroll-hint fade is missed. */}
      <div className="flex max-h-[min(44rem,var(--available-height,44rem))] flex-col">
        {(header || showSearch) && (
          <div className="shrink-0 bg-card">
            {showSearch && (
              <div className="flex items-center gap-2 px-3 pb-1 pt-3">
                <InputGroup className="flex-1 rounded-md border-gray-100 shadow-none">
                  <InputGroupAddon>
                    <Search className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="by name, address or network"
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
                <SafeListSortToggle />
              </div>
            )}
            {header}
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
