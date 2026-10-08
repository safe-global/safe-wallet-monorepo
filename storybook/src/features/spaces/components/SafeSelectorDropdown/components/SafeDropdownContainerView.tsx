import { RotateCw } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import { SelectContent, SelectItem } from '@/components/ui/select'
import { SearchInput } from '@/components/ui/search-input'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { SafeItemData } from '@views/features/spaces/components/SafeSelectorDropdown/types'

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

export interface SafeDropdownContainerViewProps {
  items: SafeItemData[]
  selectedItemId?: string
  hiddenIds: ReadonlySet<string>
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  header?: ReactNode
  footer?: ReactNode | ((close: () => void) => ReactNode)
  emptyStateOverride?: ReactNode | ((close: () => void) => ReactNode)
  closeDropdown: () => void
  search: string
  onSearchChange: (value: string) => void
  hasQuery: boolean
  hasWallet: boolean
  hasMatches: boolean
  showSearch: boolean
  showRows: boolean | undefined
  showScrollHint: boolean
  scrollAreaRef: (node: HTMLDivElement | null) => void
  sortToggle: ReactNode
  /** Drag-to-reorder list, set only under Manual sort; replaces the selectable rows. */
  reorderList?: ReactNode
  renderSafeItem: (item: SafeItemData) => ReactNode
  renderMultiChainRow: (item: SafeItemData) => ReactElement
}

export const SafeDropdownContainerView = ({
  items,
  selectedItemId,
  hiddenIds,
  isLoading,
  isError,
  onRetry,
  header,
  footer,
  emptyStateOverride,
  closeDropdown,
  search,
  onSearchChange,
  hasQuery,
  hasWallet,
  hasMatches,
  showSearch,
  showRows,
  showScrollHint,
  scrollAreaRef,
  sortToggle,
  reorderList,
  renderSafeItem,
  renderMultiChainRow,
}: SafeDropdownContainerViewProps) => {
  const renderContent = () => {
    if (isError) {
      return <DropdownContentError onRetry={onRetry} />
    }

    if (isLoading && !hasMatches && !hasQuery) {
      return Array.from({ length: SKELETON_COUNT }, (_, i) => <SafeItemSkeleton key={i} />)
    }

    const emptyText = (
      <p className="px-4 py-6 text-center text-sm text-muted-foreground" data-testid="dropdown-empty">
        {hasQuery
          ? 'No safes match your search'
          : hasWallet
            ? 'No safes yet'
            : 'Connect a wallet to find your Safe accounts'}
      </p>
    )

    if (items.length === 0) {
      // With no safes to search through at all, "no matches" would be misleading — keep the
      // tab's CTA (sign in to a workspace / connect a wallet) even while a query is typed.
      if (emptyStateOverride) {
        return (
          <div data-testid="dropdown-empty-override">
            {typeof emptyStateOverride === 'function' ? emptyStateOverride(closeDropdown) : emptyStateOverride}
          </div>
        )
      }
      return emptyText
    }

    return (
      <>
        {renderRows()}
        {!hasMatches && emptyText}
      </>
    )
  }

  const renderRows = () => {
    if (reorderList) {
      return reorderList
    }

    return items.map((item) => {
      if (item.chains.length > 1) {
        return renderMultiChainRow(item)
      }
      return (
        <SelectItem
          key={item.id}
          value={item.id}
          hidden={hiddenIds.has(item.id)}
          // Scroll anchor for the open-to-current-safe behaviour (see the scroll-to-current effect).
          data-current-safe={item.id === selectedItemId ? 'true' : undefined}
          // hover/focus:bg-muted is the grey highlight; data-selected keeps the open safe green, and
          // [&[data-selected]:hover/focus] deepens it (wins by specificity). [&>div]:min-w-0/shrink let the name column truncate; [&>span.absolute]:hidden
          // drops the built-in checkmark that would overlap the balance column.
          // `hidden` class too: SelectItem's own `flex` utility overrides the [hidden] attribute.
          className={cn(
            'group/row h-auto py-3 px-3 rounded-lg my-0.5 cursor-pointer hover:bg-muted focus:bg-muted data-[selected]:bg-sidebar-accent [&[data-selected]:hover]:bg-[var(--color-background-light-hover)] [&[data-selected]:focus]:bg-[var(--color-background-light-hover)] [&>div]:min-w-0 [&>div]:shrink [&>span.absolute]:hidden',
            hiddenIds.has(item.id) && 'hidden',
          )}
        >
          {renderSafeItem(item)}
        </SelectItem>
      )
    })
  }

  return (
    <SelectContent
      align="start"
      side="bottom"
      alignItemWithTrigger={false}
      showBackdrop
      // outline-hidden: base-ui focuses the popup on open; typing in the search field makes that
      // :focus-visible and would otherwise draw the browser's blue outline around the whole popup.
      // The shared select-list's padding and scrollbar gutter are dropped: the scroll area below owns
      // both, and the list's extra 12px+ pushed the rows' balance column into a horizontal scroll.
      className="w-[543px] max-w-[calc(100vw-2rem)] overflow-hidden bg-card border-0 ring-0 outline-hidden rounded-lg [&_[data-slot=select-scroll-down-button]]:hidden [&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-list]]:p-0 [&_[data-slot=select-list]]:[scrollbar-gutter:auto]"
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
              <div className="flex items-center gap-2 px-2 py-2">
                <SearchInput
                  variant="surface"
                  className="flex-1 shadow-xs"
                  placeholder="by name, address or network"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  // Stop keystrokes reaching base-ui Select's typeahead, which would hijack typing.
                  // Trade-off: arrows/Enter stay in the input (no list nav); Escape still closes.
                  onKeyDown={(e) => {
                    if (e.key !== 'Escape') e.stopPropagation()
                  }}
                  autoComplete="off"
                  data-testid="safe-dropdown-search-input"
                />
                {sortToggle}
              </div>
            )}
            {header}
          </div>
        )}

        <div
          ref={scrollAreaRef}
          data-testid="dropdown-scroll-area"
          className="min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-y-none px-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
        >
          {/* Below 575px (the 543px popup + its 2rem viewport margin) the popup shrinks: rows then keep
              their 527px layout and scroll horizontally. Wider, they fill the popup — no scroll. */}
          <div className={cn(showRows && 'max-[575px]:min-w-[527px]')}>{renderContent()}</div>
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
