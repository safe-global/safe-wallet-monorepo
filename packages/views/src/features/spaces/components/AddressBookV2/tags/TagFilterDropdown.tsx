import { useRef } from 'react'
import { ChevronDown, ListFilter } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import TagMenu, { existingTagIds, type TagActions } from './TagMenu'
import type { WorkspaceTag } from '../types'

export type TagFilterDropdownProps = {
  tags: WorkspaceTag[]
  /** The tags a contact must all have to be listed. */
  value: number[]
  onChange: (tagIds: number[]) => void
  /** Create, rename and delete; without them the tags are read-only. */
  actions?: TagActions
  onLimitReached?: () => void
  /** When the dropdown closes after the user changed the filters; a rename or delete doesn't count. */
  onFiltersChanged?: (tagIds: number[]) => void
}

const sameIds = (a: number[], b: number[]) => a.length === b.length && a.every((id) => b.includes(id))

/** The Filters dropdown: tick any number of tags; a tag created here isn't ticked, as it has no contacts yet. */
const TagFilterDropdown = ({
  tags,
  value,
  onChange,
  actions,
  onLimitReached,
  onFiltersChanged,
}: TagFilterDropdownProps) => {
  const selected = existingTagIds(value, tags)
  const selectionAtOpen = useRef<number[]>([])
  const isChangedByUser = useRef(false)

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      selectionAtOpen.current = selected
      isChangedByUser.current = false
    } else if (isChangedByUser.current && !sameIds(selected, selectionAtOpen.current)) {
      onFiltersChanged?.(selected)
    }
  }

  return (
    <TagMenu
      trigger={<Button variant="outline" size="action" data-testid="filters-dropdown" />}
      triggerContent={
        <>
          <ListFilter aria-hidden="true" data-icon="inline-start" />
          Filters
          {selected.length > 0 && (
            <Badge variant="secondary" size="sm" data-testid="tag-menu-count">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="text-muted-foreground size-4" aria-hidden="true" />
        </>
      }
      tags={tags}
      selected={selected}
      onSelect={(tagIds) => {
        isChangedByUser.current = true
        onChange(tagIds)
        return undefined
      }}
      onMerged={onChange}
      clearLabel="Clear filters"
      actions={actions}
      onLimitReached={onLimitReached}
      onOpenChange={handleOpenChange}
    />
  )
}

export default TagFilterDropdown
