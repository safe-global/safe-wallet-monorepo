import { useCallback, useEffect, useRef, useState } from 'react'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import { useBottomScrollFade } from '@/hooks/useBottomScrollFade'
import useWallet from '@/hooks/wallets/useWallet'
import SafeItem from './SafeItem'
import MultiChainSafeItemRow from './MultiChainSafeItemRow'
import ReorderableSafeList from './ReorderableSafeList'
import SafeListSortToggle from '@/components/common/SafeListSortToggle'
import { SafeDropdownContainerView } from '@views/features/spaces/components/SafeSelectorDropdown/components/SafeDropdownContainerView'
import { matchesSafeSearch } from '@views/features/spaces/components/SafeSelectorDropdown/utils'
import type { SafeItemData, SafeRenameTarget } from '@views/features/spaces/components/SafeSelectorDropdown/types'

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
  // Non-matches stay mounted but hidden: when a base-ui SelectItem unmounts and remounts mid-search,
  // base-ui moves focus onto an option, off the search input.
  const matchedIds = new Set(filteredItems.map((item) => item.id))
  const hiddenIds = new Set(items.map((item) => item.id).filter((id) => !matchedIds.has(id)))

  // A controlled search spans both tabs, so it stays visible even when the active tab has no rows.
  const showSearch = !isError && (searchValue !== undefined || items.length > 0)

  // Rows/skeletons get the min-width wrapper below (scroll on narrow screens).
  const showRows = !isError && (filteredItems.length > 0 || (isLoading && !query))

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
    const area = scrollAreaRef.current
    const current = area?.querySelector<HTMLElement>('[data-current-safe="true"]')
    if (!area || !current) return
    // Scroll only this area: scrollIntoView also scrolls the overflow-hidden popup, clipping its header.
    const offset = current.getBoundingClientRect().top - area.getBoundingClientRect().top
    area.scrollTop += offset - (area.clientHeight - current.offsetHeight) / 2
  }, [selectedItemId, isLoading, query, items.length])

  return (
    <SafeDropdownContainerView
      items={items}
      selectedItemId={selectedItemId}
      hiddenIds={hiddenIds}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      header={header}
      footer={footer}
      emptyStateOverride={emptyStateOverride}
      closeDropdown={closeDropdown}
      search={search}
      onSearchChange={setSearch}
      hasQuery={Boolean(query)}
      hasWallet={Boolean(wallet)}
      hasMatches={filteredItems.length > 0}
      showSearch={showSearch}
      showRows={showRows}
      showScrollHint={showScrollHint}
      scrollAreaRef={attachScrollArea}
      sortToggle={<SafeListSortToggle />}
      // Manual sort turns the list into a drag-to-reorder list, with dragging disabled while searching
      // (a drop would persist a partial order). Selecting a row navigates and closes, like the Select rows.
      reorderList={
        onReorder ? (
          <ReorderableSafeList
            items={items}
            hiddenIds={hiddenIds}
            selectedItemId={selectedItemId}
            onSelect={(itemId) => {
              onItemSelect?.(itemId)
              closeDropdown()
            }}
            onRename={handleRename}
            onReorder={onReorder}
            isDragDisabled={Boolean(query)}
          />
        ) : undefined
      }
      renderSafeItem={(item) => <SafeItem {...item} onRename={handleRename} />}
      renderMultiChainRow={(item) => (
        <MultiChainSafeItemRow
          key={item.id}
          item={item}
          onRename={handleRename}
          isSelected={item.id === selectedItemId}
          hidden={hiddenIds.has(item.id)}
        />
      )}
    />
  )
}

export default SafeDropdownContainer
