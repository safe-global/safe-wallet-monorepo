import { useRef, useState } from 'react'
import { ChevronDown, ListFilter } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import { TagChips } from './TagChip'
import TagOptionList, { type TagEditing } from './TagOptionList'
import {
  CONTACT_TAG_LIMIT_MESSAGE,
  MAX_TAGS_PER_CONTACT,
  MAX_TAGS_PER_WORKSPACE,
  WORKSPACE_TAG_LIMIT_MESSAGE,
  normalizeTagName,
  validateTagName,
} from './tagRules'
import type { WorkspaceTag } from '../types'

/** Workspace tag changes; each applies at once, not when a dialog is saved. */
export type TagActions = {
  /** Resolves to the new tag, or the error to show. */
  onCreate: (name: string) => Promise<{ tag?: WorkspaceTag; error?: string }>
  /** Resolves to the error to show, or the tag a rename onto another tag's name merged into. */
  onRename: (tag: WorkspaceTag, name: string) => Promise<{ error?: string; mergedIntoId?: number }>
  onDelete: (tag: WorkspaceTag) => Promise<void>
}

export type TagSelectProps = {
  /** `filter` narrows the list of contacts; `assign` picks a contact's tags, up to 3. */
  mode: 'filter' | 'assign'
  tags: WorkspaceTag[]
  value: number[]
  onChange: (tagIds: number[]) => void
  /** Create, rename and delete; without them the tags are read-only. */
  actions?: TagActions
  /** When creating a tag hits the workspace limit. */
  onLimitReached?: () => void
  /** Filter mode: when the dropdown closes after the user changed the selection; a rename or delete doesn't count. */
  onSelectionCommitted?: (tagIds: number[]) => void
  disabled?: boolean
}

const sameIds = (a: number[], b: number[]) => a.length === b.length && a.every((id) => b.includes(id))

/** The tag dropdown of the Filters and of every tag picker: search, tick, create, rename and delete. */
const TagSelect = ({
  mode,
  tags,
  value,
  onChange,
  actions,
  onLimitReached,
  onSelectionCommitted,
  disabled,
}: TagSelectProps) => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const selectionAtOpen = useRef<number[]>([])
  const isChangedByUser = useRef(false)

  // A deleted tag drops out of the selection
  const selected = value.filter((id) => tags.some((tag) => tag.id === id))
  const isFilter = mode === 'filter'

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    setError(undefined)
    if (isOpen) {
      selectionAtOpen.current = selected
      isChangedByUser.current = false
    } else if (isChangedByUser.current && !sameIds(selected, selectionAtOpen.current)) {
      onSelectionCommitted?.(selected)
    }
  }

  const select = (tagIds: number[]) => {
    setError(undefined)
    if (!isFilter && tagIds.length > MAX_TAGS_PER_CONTACT) {
      setError(CONTACT_TAG_LIMIT_MESSAGE)
      return
    }
    isChangedByUser.current = true
    onChange(tagIds)
  }

  const handleCreate = async (text: string) => {
    if (!actions) return
    setError(undefined)
    const validationError = validateTagName(text)
    if (validationError) {
      setError(validationError)
      return
    }
    if (tags.length >= MAX_TAGS_PER_WORKSPACE) {
      setError(WORKSPACE_TAG_LIMIT_MESSAGE)
      onLimitReached?.()
      return
    }
    if (!isFilter && selected.length >= MAX_TAGS_PER_CONTACT) {
      setError(CONTACT_TAG_LIMIT_MESSAGE)
      return
    }
    const { tag, error: createError } = await actions.onCreate(normalizeTagName(text))
    if (createError) setError(createError)
    // The filters stay as they are: a new tag has no contacts yet
    if (tag && !isFilter) select([...selected, tag.id])
  }

  const tagEditing: TagEditing<WorkspaceTag> | undefined = actions && {
    onRename: async (tag, name) => {
      const { error: renameError, mergedIntoId } = await actions.onRename(tag, name)
      if (renameError) return renameError
      if (mergedIntoId !== undefined && selected.includes(tag.id)) {
        onChange([...new Set(selected.map((id) => (id === tag.id ? mergedIntoId : id)))])
      }
      return undefined
    },
    onDelete: actions.onDelete,
  }

  const options = tags.map((tag) => ({
    value: String(tag.id),
    name: tag.name,
    color: tag.color,
    contactCount: tag.contactCount,
    tag,
  }))

  const selectedTags = selected.flatMap((id) => tags.find((tag) => tag.id === id) ?? [])

  const trigger = (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size={isFilter ? 'action' : 'sm'}
            disabled={disabled}
            data-testid={isFilter ? 'filters-dropdown' : 'tag-picker'}
          />
        }
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {isFilter && <ListFilter aria-hidden="true" data-icon="inline-start" />}
        {isFilter ? 'Filters' : 'Tags'}
        {selected.length > 0 && (
          <Badge variant="secondary" size="sm" data-testid="tag-select-count">
            {selected.length}
          </Badge>
        )}
        <ChevronDown className="text-muted-foreground size-4" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={4} className="flex w-72 flex-col gap-1 p-1">
        <TagOptionList
          options={options}
          value={selected.map(String)}
          onChange={(next) => select(next.map(Number))}
          onCreate={actions && ((text) => void handleCreate(text))}
          tagEditing={tagEditing}
        />

        {error && (
          <p className="text-destructive px-2 py-1 text-xs" role="alert" data-testid="tag-select-error">
            {error}
          </p>
        )}

        {selected.length > 0 && (
          <div className="border-border border-t pt-1">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => select([])}>
              {isFilter ? 'Clear filters' : 'Clear'}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )

  if (isFilter) return trigger

  return (
    <div className="flex flex-wrap items-center gap-2">
      {trigger}
      <TagChips tags={selectedTags} />
    </div>
  )
}

export default TagSelect
