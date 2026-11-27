import { useState, type ReactElement, type ReactNode } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import TagOptionList, { type TagEditing } from './TagOptionList'
import {
  MAX_TAGS_PER_WORKSPACE,
  WORKSPACE_TAG_LIMIT_MESSAGE,
  normalizeTagName,
  validateTagName,
} from '@safe-global/utils/validation/tags'
import type { WorkspaceTag } from '../types'

/** Workspace tag changes; each applies at once, not when a dialog is saved. */
export type TagActions = {
  /** Resolves to the new tag, or the error to show. */
  onCreate: (name: string) => Promise<{ tag?: WorkspaceTag; error?: string }>
  /** Resolves to the error to show, or the tag a rename onto another tag's name merged into. */
  onRename: (tag: WorkspaceTag, name: string) => Promise<{ error?: string; mergedIntoId?: number }>
  /** Resolves to whether the tag was deleted. */
  onDelete: (tag: WorkspaceTag) => Promise<boolean>
}

/** The ticked ids the workspace still has; a deleted tag drops out. */
export const existingTagIds = (tagIds: number[], tags: WorkspaceTag[]): number[] =>
  tagIds.filter((id) => tags.some((tag) => tag.id === id))

/** The same tags, in any order. */
export const sameTagIds = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((id) => b.includes(id))

export type TagMenuProps = {
  /** The button that opens the menu, without its children. */
  trigger: ReactElement
  triggerContent: ReactNode
  tags: WorkspaceTag[]
  /** Ticked tag ids, all of them tags the workspace has. */
  selected: number[]
  /** The user ticked, unticked or cleared; resolves to an error to show, if the change is refused. */
  onSelect: (tagIds: number[]) => string | undefined
  /** The selection after a ticked tag was merged into another or deleted. */
  onSelectionRemapped: (tagIds: number[]) => void
  clearLabel: string
  /** Create, rename and delete; without them the tags are read-only. */
  actions?: TagActions
  /** When creating a tag hits the workspace limit. */
  onLimitReached?: () => void
  /** Checked before a tag is created; resolves to an error to show instead. */
  beforeCreate?: () => string | undefined
  onCreated?: (tag: WorkspaceTag) => void
  onOpenChange?: (open: boolean) => void
  /** Shown above the list; omitted where the trigger already names it. */
  heading?: string
}

/** What the Filters and the tag picker share: search, tick, create, rename and delete, in a popover. */
const TagMenu = ({
  trigger,
  triggerContent,
  tags,
  selected,
  onSelect,
  onSelectionRemapped,
  clearLabel,
  actions,
  onLimitReached,
  beforeCreate,
  onCreated,
  onOpenChange,
  heading,
}: TagMenuProps) => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    setError(undefined)
    onOpenChange?.(isOpen)
  }

  const select = (tagIds: number[]) => setError(onSelect(tagIds))

  const handleCreate = async (text: string): Promise<boolean> => {
    if (!actions) return false
    setError(undefined)
    const refusal =
      validateTagName(text) ?? (tags.length >= MAX_TAGS_PER_WORKSPACE ? WORKSPACE_TAG_LIMIT_MESSAGE : beforeCreate?.())
    if (refusal) {
      setError(refusal)
      if (refusal === WORKSPACE_TAG_LIMIT_MESSAGE) onLimitReached?.()
      return false
    }
    const { tag, error: createError } = await actions.onCreate(normalizeTagName(text))
    if (createError) setError(createError)
    if (tag) onCreated?.(tag)
    return Boolean(tag)
  }

  const tagEditing: TagEditing<WorkspaceTag> | undefined = actions && {
    onRename: async (tag, name) => {
      const refusal = validateTagName(name)
      if (refusal) return refusal
      const { error: renameError, mergedIntoId } = await actions.onRename(tag, normalizeTagName(name))
      if (renameError) return renameError
      if (mergedIntoId !== undefined && selected.includes(tag.id)) {
        onSelectionRemapped([...new Set(selected.map((id) => (id === tag.id ? mergedIntoId : id)))])
      }
      return undefined
    },
    onDelete: async (tag) => {
      const deleted = await actions.onDelete(tag)
      if (deleted && selected.includes(tag.id)) onSelectionRemapped(selected.filter((id) => id !== tag.id))
    },
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
      <PopoverTrigger render={trigger} aria-haspopup="dialog" aria-expanded={open}>
        {triggerContent}
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={4} className="flex w-72 flex-col gap-1 p-1">
        <TagOptionList
          options={options}
          value={selected.map(String)}
          onChange={(next) => select(next.map(Number))}
          onCreate={actions && handleCreate}
          tagEditing={tagEditing}
          heading={heading}
        />

        {error && (
          <p className="text-destructive px-2 py-1 text-xs" role="alert" data-testid="tag-menu-error">
            {error}
          </p>
        )}

        {selected.length > 0 && (
          <div className="border-border border-t pt-1">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => select([])}>
              {clearLabel}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default TagMenu
