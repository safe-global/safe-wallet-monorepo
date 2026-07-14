import { useMemo } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { SearchInput } from '@/components/ui/search-input'
import TrustedSafesItem from './TrustedSafesItem'
import MultiChainSelectionItem from './MultiChainSelectionItem'
import type { SelectableSafe, SelectableItem } from './useTrustedSafesModal.types'
import { isSelectableMultiChainSafe } from './useTrustedSafesModal.types'

interface TrustedSafesListProps {
  items: SelectableItem[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onToggle: (address: string) => void
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
    <div
      className="border-border my-0.5 overflow-hidden rounded-md border"
      data-testid={`similarity-group-${group.groupKey}`}
    >
      <div className="bg-[var(--color-warning-background)] px-3 py-1.5">
        <Typography variant="paragraph-mini-medium" className="text-[var(--color-warning-main)]">
          Similar addresses – verify carefully
        </Typography>
      </div>
      <div className="bg-background mb-4 p-2">
        {group.items.map((item) => (
          <SelectionItem key={item.address} item={item} onToggle={onToggle} />
        ))}
      </div>
    </div>
  )
}

/**
 * List of safes for selection
 * Groups similar addresses together with visual highlighting
 */
const TrustedSafesList = ({ items, isLoading, searchQuery, onSearchChange, onToggle }: TrustedSafesListProps) => {
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

  const showSearch = items.length > 0 || Boolean(searchQuery)

  return (
    <div>
      {showSearch && (
        <SearchInput
          className="mb-4"
          placeholder="Search by name or full address"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
        />
      )}

      <div>
        {items.length === 0 ? (
          <div className="py-8 text-center">
            <Typography color="muted">
              {searchQuery ? 'No safes found matching your search' : 'No safes available'}
            </Typography>
          </div>
        ) : (
          <>
            {/* Render similarity groups first */}
            {groups.map((group) => (
              <SimilarityGroupContainer key={group.groupKey} group={group} onToggle={onToggle} />
            ))}

            {/* Render ungrouped items */}
            {sortedUngroupedItems.map((item) => (
              <div key={item.address} className="my-0.5">
                <SelectionItem item={item} onToggle={onToggle} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default TrustedSafesList
