import { useRef, useState } from 'react'
import { ChevronDown, ListFilter } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import { FacetOptionList, type FacetOption } from '@safe-global/views/components/common/FacetFilter'
import { TagChip } from './tags/TagChip'
import type { WorkspaceTag } from './types'

export type TagEditing = {
  /** Resolves to an error message to keep the editor open, or `undefined` once renamed. */
  onRename: (tag: WorkspaceTag, name: string) => Promise<string | undefined>
  onDelete: (tag: WorkspaceTag) => Promise<void>
}

export type ContactFiltersDropdownProps = {
  tags: WorkspaceTag[]
  selectedTagIds: number[]
  onSelectedTagIdsChange: (tagIds: number[]) => void
  /** When the dropdown closes after the user changed the selection; a rename or delete that changes it doesn't count. */
  onSelectionCommitted?: (tagIds: number[]) => void
  /** Rename and delete a tag across the workspace; without it the tags are read-only. */
  tagEditing?: TagEditing
}

const SectionHeading = ({ children }: { children: string }) => (
  <p className="text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium">{children}</p>
)

const deleteConfirmation = (tag: WorkspaceTag): string =>
  tag.contactCount > 0
    ? `Delete ‘${tag.name}’ from ${tag.contactCount} ${tag.contactCount === 1 ? 'contact' : 'contacts'}?`
    : `Delete ‘${tag.name}’?`

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
  const tagById = (value: string) => tags.find((tag) => String(tag.id) === value)

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

  const options: FacetOption[] = tags.map((tag) => ({
    value: String(tag.id),
    label: <TagChip name={tag.name} color={tag.color} />,
    searchText: tag.name,
    count: tag.contactCount,
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
        <SectionHeading>Tags</SectionHeading>
        <FacetOptionList
          label="Tags"
          options={options}
          value={selectedTagIds.map(String)}
          onChange={(next) => select(next.map(Number))}
          searchable
          searchPlaceholder="Search tags"
          emptyText="No tags yet"
          onRenameOption={
            tagEditing &&
            ((value, name) => {
              const tag = tagById(value)
              return tag ? tagEditing.onRename(tag, name) : undefined
            })
          }
          onDeleteOption={
            tagEditing &&
            (async (value) => {
              const tag = tagById(value)
              if (tag) await tagEditing.onDelete(tag)
            })
          }
          deleteConfirmation={(option) => {
            const tag = tagById(option.value)
            return tag ? deleteConfirmation(tag) : `Delete ‘${option.searchText}’?`
          }}
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
