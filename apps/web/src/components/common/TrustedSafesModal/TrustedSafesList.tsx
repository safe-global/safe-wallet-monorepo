import { useMemo } from 'react'
import { Search } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
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
 * Flat list of safes for selection. Similarity is surfaced per-row via the Mode B
 * SimilarityFlag (anchor + intra-list), so there is no separate grouping/bucketing.
 */
const TrustedSafesList = ({ items, isLoading, searchQuery, onSearchChange, onToggle }: TrustedSafesListProps) => {
  const sortedItems = useMemo(() => [...items].sort((a, b) => Number(b.isSelected) - Number(a.isSelected)), [items])

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

      <div>
        {items.length === 0 ? (
          <div className="py-8 text-center">
            <span className="text-sm text-muted-foreground">
              {searchQuery ? 'No safes found matching your search' : 'No safes available'}
            </span>
          </div>
        ) : (
          sortedItems.map((item) => (
            <div key={item.address} className="my-0.5">
              <SelectionItem item={item} onToggle={onToggle} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TrustedSafesList
