import { useMemo } from 'react'
import { Search } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/utils/cn'
import TrustedSafesItem from './TrustedSafesItem'
import MultiChainSelectionItem from './MultiChainSelectionItem'
import { MODAL_SAFE_GRID } from './constants'
import type { SelectableSafe, SelectableItem } from './useTrustedSafesModal.types'
import { isSelectableMultiChainSafe } from './useTrustedSafesModal.types'

const columnLabel = 'text-muted-foreground text-xs font-semibold uppercase tracking-wide'

interface TrustedSafesListProps {
  items: SelectableItem[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onToggle: (address: string) => void
  /** When false, the search input is rendered by the caller (e.g. in a shared toolbar). */
  showSearchInput?: boolean
}

interface SimilarityGroupData {
  groupKey: string
  items: SelectableItem[]
}

/**
 * Group items by their similarity group and identify ungrouped items
 */
const groupItemsBySimilarity = (
  items: SelectableItem[],
): { groups: SimilarityGroupData[]; ungroupedItems: SelectableItem[] } => {
  const groupMap = new Map<string, SelectableItem[]>()
  const ungroupedItems: SelectableItem[] = []

  for (const item of items) {
    if (!item.similarityGroup) {
      ungroupedItems.push(item)
      continue
    }
    const existing = groupMap.get(item.similarityGroup) || []
    existing.push(item)
    groupMap.set(item.similarityGroup, existing)
  }

  const groups: SimilarityGroupData[] = []
  for (const [groupKey, groupItems] of groupMap) {
    if (groupItems.length < 2) {
      ungroupedItems.push(...groupItems)
      continue
    }
    groups.push({ groupKey, items: groupItems })
  }

  return { groups, ungroupedItems }
}

/**
 * Render a single item (either multichain or single safe)
 */
const SelectionItem = ({ item, onToggle }: { item: SelectableItem; onToggle: (address: string) => void }) => {
  if (isSelectableMultiChainSafe(item)) {
    return <MultiChainSelectionItem multiSafe={item} onToggle={onToggle} />
  }
  return <TrustedSafesItem safe={item as SelectableSafe} onToggle={onToggle} />
}

/**
 * Similarity group visual container
 * Subtle border to highlight similar addresses
 */
const SimilarityGroupContainer = ({
  group,
  onToggle,
}: {
  group: SimilarityGroupData
  onToggle: (address: string) => void
}) => {
  return (
    <div data-testid={`similarity-group-${group.groupKey}`}>
      <div className="bg-yellow-50 px-3 py-1.5 dark:bg-[var(--color-warning-background)]">
        <span className="text-xs font-medium text-yellow-800 dark:text-[var(--color-warning1-contrast-text)]">
          Similar addresses – verify carefully
        </span>
      </div>
      {group.items.map((item) => (
        <SelectionItem key={item.address} item={item} onToggle={onToggle} />
      ))}
    </div>
  )
}

/**
 * List of safes for selection
 * Groups similar addresses together with visual highlighting
 */
const TrustedSafesList = ({
  items,
  isLoading,
  searchQuery,
  onSearchChange,
  onToggle,
  showSearchInput = true,
}: TrustedSafesListProps) => {
  const { groups, ungroupedItems } = useMemo(() => groupItemsBySimilarity(items), [items])

  const sortedUngroupedItems = useMemo(
    () => [...ungroupedItems].sort((a, b) => Number(b.isSelected) - Number(a.isSelected)),
    [ungroupedItems],
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  const showSearch = showSearchInput && (items.length > 0 || Boolean(searchQuery))

  return (
    <div>
      {showSearch && (
        <InputGroup className="mb-4 rounded-md border-gray-100 shadow-none">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by name or full address"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
          />
        </InputGroup>
      )}

      {items.length === 0 ? (
        <div className="py-8 text-center">
          <span className="text-sm text-muted-foreground">
            {searchQuery ? 'No safes found matching your search' : 'No safes available'}
          </span>
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          <div className={cn(MODAL_SAFE_GRID, 'border-border bg-muted/30 border-b px-3 py-2.5')}>
            <span />
            <span className={columnLabel}>Account</span>
            <span className={columnLabel}>Chains</span>
            <span className={cn(columnLabel, 'text-right')}>Balance</span>
            <span className={cn(columnLabel, 'text-right')}>Threshold</span>
          </div>

          {/* Similarity groups first, then the rest */}
          {groups.map((group) => (
            <SimilarityGroupContainer key={group.groupKey} group={group} onToggle={onToggle} />
          ))}
          {sortedUngroupedItems.map((item) => (
            <SelectionItem key={item.address} item={item} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

export default TrustedSafesList
