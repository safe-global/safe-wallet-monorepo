import { Button } from '@safe-global/views/components/ui/button'
import { Chip } from '@safe-global/views/components/ui/chip'
import {
  formatFilterValues,
  getAppliedFilters,
  type FilterDimension,
  type FilterSelection,
} from '@safe-global/views/components/common/Filters/filterState'

type AppliedFiltersProps = {
  dimensions: FilterDimension[]
  selection: FilterSelection
  onRemove: (id: string) => void
  onClearAll: () => void
}

export function AppliedFilters({ dimensions, selection, onRemove, onClearAll }: AppliedFiltersProps) {
  const applied = getAppliedFilters(dimensions, selection)
  if (applied.length === 0) return null

  return (
    <div role="group" aria-label="Applied filters" className="flex flex-wrap items-center gap-2">
      {applied.map((filter) => (
        <Chip key={filter.id} variant="card" size="xl" onDelete={() => onRemove(filter.id)}>
          <span className="text-muted-foreground">{filter.label}:</span>
          {formatFilterValues(filter.values)}
        </Chip>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll}>
        Clear
      </Button>
    </div>
  )
}
