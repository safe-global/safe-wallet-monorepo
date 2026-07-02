import { useMemo } from 'react'
import { Search } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { useSimilarityGroups, SimilarityGroupContainer } from '@/features/address-poisoning'
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
 * Safe selection list. Visually-similar safes are clustered into a "verify carefully" box (Mode B,
 * anchor + intra-list); the rest render flat with selected floated to the top.
 */
const TrustedSafesList = ({ items, isLoading, searchQuery, onSearchChange, onToggle }: TrustedSafesListProps) => {
  const addresses = useMemo(() => items.map((item) => item.address), [items])
  const { groups, ungrouped } = useSimilarityGroups(addresses)

  const itemByAddress = useMemo(() => {
    const map = new Map<string, SelectableItem>()
    for (const item of items) map.set(item.address.toLowerCase(), item)
    return map
  }, [items])

  const ungroupedItems = useMemo(() => {
    const list = ungrouped
      .map((address) => itemByAddress.get(address.toLowerCase()))
      .filter((item): item is SelectableItem => Boolean(item))
    return list.sort((a, b) => Number(b.isSelected) - Number(a.isSelected))
  }, [ungrouped, itemByAddress])

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
          <>
            {/* Similar safes framed together (front-or-back look-alikes), red if any both-ends match. */}
            {groups.map((group) => (
              <SimilarityGroupContainer key={group.key} critical={group.isCritical}>
                {group.addresses.map((address) => {
                  const item = itemByAddress.get(address.toLowerCase())
                  return item ? <SelectionItem key={item.address} item={item} onToggle={onToggle} /> : null
                })}
              </SimilarityGroupContainer>
            ))}
            {ungroupedItems.map((item) => (
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
