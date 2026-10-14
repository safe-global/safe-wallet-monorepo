import { useState } from 'react'
import { ChevronDown, ListFilter } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import {
  FacetOptionList,
  type FacetOption,
  type FacetOptionListProps,
} from '@safe-global/views/components/common/FacetFilter'
import { activeFilterCount } from './filters'
import { TagChip } from './tags/TagChip'
import { CATEGORY_FILTER_OPTIONS, type CategoryFilterValue, type ContactFilters, type TagCount } from './types'

type TagEditing = Pick<FacetOptionListProps, 'onRenameOption' | 'onDeleteOption' | 'deleteConfirmation'>

export type ContactFiltersDropdownProps = {
  filters: ContactFilters
  onFiltersChange: (filters: ContactFilters) => void
  categoryCounts: ReadonlyMap<CategoryFilterValue, number>
  /** Distinct tags in the book. The Tags section is hidden when there are none. */
  tags: TagCount[]
  /** Rename and delete a tag across the whole book, from the filter list. */
  tagEditing?: TagEditing
}

const SectionHeading = ({ children }: { children: string }) => (
  <p className="text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium">{children}</p>
)

/** One "Filters" dropdown: Tags (searchable, renamable, deletable) on top, Category below. */
const ContactFiltersDropdown = ({
  filters,
  onFiltersChange,
  categoryCounts,
  tags,
  tagEditing,
}: ContactFiltersDropdownProps) => {
  const [open, setOpen] = useState(false)
  const activeCount = activeFilterCount(filters)

  const tagOptions: FacetOption[] = tags.map(({ tag, count }) => ({
    value: tag,
    label: <TagChip tag={tag} />,
    searchText: tag,
    count,
  }))

  const categoryOptions: FacetOption<CategoryFilterValue>[] = CATEGORY_FILTER_OPTIONS.map((option) => ({
    ...option,
    count: categoryCounts.get(option.value) ?? 0,
  }))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" size="sm" data-testid="filters-dropdown" />}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <ListFilter aria-hidden="true" data-icon="inline-start" />
        Filters
        {activeCount > 0 && (
          <Badge variant="secondary" size="sm" data-testid="filters-count">
            {activeCount}
          </Badge>
        )}
        <ChevronDown className="text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={4} className="flex w-72 flex-col gap-1 p-1">
        {tagOptions.length > 0 && (
          <>
            <SectionHeading>Tags</SectionHeading>
            <FacetOptionList
              label="Tags"
              options={tagOptions}
              value={filters.tags}
              onChange={(next) => onFiltersChange({ ...filters, tags: next })}
              searchable
              searchPlaceholder="Search tags"
              {...tagEditing}
            />
            <div className="border-border my-1 border-t" />
          </>
        )}

        <SectionHeading>Category</SectionHeading>
        <FacetOptionList
          label="Category"
          options={categoryOptions}
          value={filters.categories}
          onChange={(next) => onFiltersChange({ ...filters, categories: next })}
          searchable={false}
        />

        {activeCount > 0 && (
          <div className="border-border border-t pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onFiltersChange({ ...filters, categories: [], tags: [] })}
            >
              Clear filters
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default ContactFiltersDropdown
