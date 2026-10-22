import { useRef, useState } from 'react'
import { ChevronDown, ListFilter } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import TagOptionList, { type TagEditing } from './tags/TagOptionList'
import type { WorkspaceTag } from './types'

export type ContactFiltersDropdownProps = {
  tags: WorkspaceTag[]
  selectedTagIds: number[]
  onSelectedTagIdsChange: (tagIds: number[]) => void
  /** When the dropdown closes after the user changed the selection; a rename or delete that changes it doesn't count. */
  onSelectionCommitted?: (tagIds: number[]) => void
  /** Rename and delete a tag across the workspace; without it the tags are read-only. */
  tagEditing?: TagEditing<WorkspaceTag>
}

const sameIds = (a: number[], b: number[]) => a.length === b.length && a.every((id) => b.includes(id))

const ContactFiltersDropdown = ({
  tags,
  selectedTagIds,
  onSelectedTagIdsChange,
  onSelectionCommitted,
  tagEditing,
}: ContactFiltersDropdownProps) => {
  const [open, setOpen] = useState(false)
  const selectionAtOpen = useRef(selectedTagIds)
  const isChangedByUser = useRef(false)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      selectionAtOpen.current = selectedTagIds
      isChangedByUser.current = false
    } else if (isChangedByUser.current && !sameIds(selectedTagIds, selectionAtOpen.current)) {
      onSelectionCommitted?.(selectedTagIds)
    }
  }

  const select = (tagIds: number[]) => {
    isChangedByUser.current = true
    onSelectedTagIdsChange(tagIds)
  }

  const options = tags.map((tag) => ({
    value: String(tag.id),
    name: tag.name,
    color: tag.color,
    contactCount: tag.contactCount,
    tag,
  }))

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={<Button variant="outline" size="action" data-testid="filters-dropdown" />}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <ListFilter aria-hidden="true" data-icon="inline-start" />
        Filters
        {selectedTagIds.length > 0 && (
          <Badge variant="secondary" size="sm" data-testid="filters-count">
            {selectedTagIds.length}
          </Badge>
        )}
        <ChevronDown className="text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={4} className="flex w-72 flex-col gap-1 p-1">
        <TagOptionList
          options={options}
          value={selectedTagIds.map(String)}
          onChange={(next) => select(next.map(Number))}
          tagEditing={tagEditing}
        />

        {selectedTagIds.length > 0 && (
          <div className="border-border border-t pt-1">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => select([])}>
              Clear filters
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default ContactFiltersDropdown
