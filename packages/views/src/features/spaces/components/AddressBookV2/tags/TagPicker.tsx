import { useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { TagChips } from './TagChip'
import TagMenu, { existingTagIds, type TagActions } from './TagMenu'
import { CONTACT_TAG_LIMIT_MESSAGE, MAX_TAGS_PER_CONTACT } from './tagRules'
import type { WorkspaceTag } from '../types'

export type TagPickerProps = {
  tags: WorkspaceTag[]
  /** The contact's tags. */
  value: number[]
  onChange: (tagIds: number[]) => void
  /** Create, rename and delete; they apply at once, not when the dialog is saved. */
  actions?: TagActions
  onLimitReached?: () => void
  disabled?: boolean
}

/** A contact's tags in Edit tags and Add / Edit contact: up to 3, shown beside the button; a tag created here is ticked. */
const TagPicker = ({ tags, value, onChange, actions, onLimitReached, disabled }: TagPickerProps) => {
  const selected = existingTagIds(value, tags)
  const isFull = (count: number) => count > MAX_TAGS_PER_CONTACT
  // A tick made while a create is in flight must survive it
  const latestSelected = useRef(selected)
  useEffect(() => {
    latestSelected.current = selected
  })

  const tickCreated = (tagId: number) => {
    const next = [...latestSelected.current, tagId]
    if (!isFull(next.length)) onChange(next)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TagMenu
        trigger={<Button variant="outline" size="sm" disabled={disabled} data-testid="tag-picker" />}
        triggerContent={
          <>
            Tags
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
          if (isFull(tagIds.length)) return CONTACT_TAG_LIMIT_MESSAGE
          onChange(tagIds)
          return undefined
        }}
        onMerged={onChange}
        clearLabel="Clear"
        actions={actions}
        onLimitReached={onLimitReached}
        beforeCreate={() => (isFull(selected.length + 1) ? CONTACT_TAG_LIMIT_MESSAGE : undefined)}
        onCreated={(tag) => tickCreated(tag.id)}
      />
      <TagChips tags={selected.flatMap((id) => tags.find((tag) => tag.id === id) ?? [])} />
    </div>
  )
}

export default TagPicker
