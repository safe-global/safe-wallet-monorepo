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
import { isSystemTag } from './tags/systemTags'
import { TagChip } from './tags/TagChip'
import type { ContactFilters, TagCount } from './types'

type TagEditing = Pick<FacetOptionListProps, 'onRenameOption' | 'onDeleteOption' | 'deleteConfirmation'>

export type ContactFiltersDropdownProps = {
  filters: ContactFilters
  onFiltersChange: (filters: ContactFilters) => void
  /** Automatic labels in the book (Workspace Safe, Signer), in their own Type section. */
  systemTags: TagCount[]
  /** Distinct team-written tags in the book. */
  tags: TagCount[]
  /** Rename and delete a tag across the whole book, from the filter list. */
  tagEditing?: TagEditing
}

const SectionHeading = ({ children }: { children: string }) => (
  <p className="text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium">{children}</p>
)

/** One "Filters" dropdown: the automatic Type labels, then the team's tags, which can be renamed or deleted. */
const ContactFiltersDropdown = ({
  filters,
  onFiltersChange,
  systemTags,
  tags,
  tagEditing,
}: ContactFiltersDropdownProps) => {
  const [open, setOpen] = useState(false)
  const activeCount = activeFilterCount(filters)

  const toOption = ({ tag, count }: TagCount): FacetOption => ({
    value: tag,
    label: <TagChip tag={tag} />,
    searchText: tag,
    count,
  })
  // Both sections filter through `filters.tags`; each edits only its own values.
  const selectedSystem = filters.tags.filter(isSystemTag)
  const selectedTags = filters.tags.filter((tag) => !isSystemTag(tag))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" size="lg" data-testid="filters-dropdown" />}
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
        {systemTags.length > 0 && (
          <>
            <SectionHeading>Type</SectionHeading>
            <FacetOptionList
              label="Type"
              options={systemTags.map(toOption)}
              value={selectedSystem}
              onChange={(next) => onFiltersChange({ ...filters, tags: [...next, ...selectedTags] })}
              searchable={false}
            />
            <div className="border-border my-1 border-t" />
          </>
        )}

        <SectionHeading>Tags</SectionHeading>
        <FacetOptionList
          label="Tags"
          options={tags.map(toOption)}
          value={selectedTags}
          onChange={(next) => onFiltersChange({ ...filters, tags: [...selectedSystem, ...next] })}
          searchable
          searchPlaceholder="Search tags"
          emptyText="No tags yet"
          {...tagEditing}
        />

        {activeCount > 0 && (
          <div className="border-border border-t pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onFiltersChange({ ...filters, tags: [] })}
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
