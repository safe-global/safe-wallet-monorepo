import { useMemo } from 'react'
import { Box, Typography, CircularProgress, TextField, InputAdornment } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import SafeSelectionItem from './SafeSelectionItem'
import MultiChainSelectionItem from './MultiChainSelectionItem'
import type { SelectableSafe, SelectableItem } from '../../hooks/useSafeSelectionModal.types'
import { isSelectableMultiChainSafe } from '../../hooks/useSafeSelectionModal.types'

interface SafeSelectionListProps {
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
  return <SafeSelectionItem safe={item as SelectableSafe} onToggle={onToggle} />
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
    <Box
      sx={{
        my: 0.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'border.light',
        overflow: 'hidden',
      }}
      data-testid={`similarity-group-${group.groupKey}`}
    >
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          backgroundColor: 'warning.background',
        }}
      >
        <Typography variant="caption" fontWeight={500} color="warning.main">
          Similar addresses – verify carefully
        </Typography>
      </Box>
      <Box sx={{ backgroundColor: 'background.paper', p: 1, mb: 2 }}>
        {group.items.map((item) => (
          <SelectionItem key={item.address} item={item} onToggle={onToggle} />
        ))}
      </Box>
    </Box>
  )
}

/**
 * List of safes for selection
 * Groups similar addresses together with visual highlighting
 */
const SafeSelectionList = ({ items, isLoading, searchQuery, onSearchChange, onToggle }: SafeSelectionListProps) => {
  const { groups, ungroupedItems } = useMemo(() => groupItemsBySimilarity(items), [items])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <TextField
        placeholder="Search by name or full address"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box>
        {items.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchQuery ? 'No safes found matching your search' : 'No safes available'}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Render similarity groups first */}
            {groups.map((group) => (
              <SimilarityGroupContainer key={group.groupKey} group={group} onToggle={onToggle} />
            ))}

            {/* Render ungrouped items */}
            {ungroupedItems.map((item) => (
              <Box key={item.address} sx={{ my: 0.5 }}>
                <SelectionItem item={item} onToggle={onToggle} />
              </Box>
            ))}
          </>
        )}
      </Box>
    </Box>
  )
}

export default SafeSelectionList
