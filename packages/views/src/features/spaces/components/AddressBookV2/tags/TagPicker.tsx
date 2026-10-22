import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import { TagChips } from './TagChip'
import TagOptionList, { type TagEditing, type TagOption } from './TagOptionList'
import { pickFreeColor, type TagChoice } from './tagColor'
import {
  CONTACT_TAG_LIMIT_MESSAGE,
  MAX_TAGS_PER_CONTACT,
  WORKSPACE_TAG_LIMIT_MESSAGE,
  normalizeTagName,
  sameTagName,
  validateTagName,
} from './tagRules'
import type { WorkspaceTag } from '../types'

export type TagPickerProps = {
  /** The contact's tags, including new ones with the colour picked when they were created. */
  value: TagChoice[]
  onChange: (next: TagChoice[]) => void
  workspaceTags: WorkspaceTag[]
  /** When the workspace tag limit message shows. */
  onLimitReached?: () => void
  /** Rename and delete a workspace tag; they apply at once, not on save. */
  tagEditing?: TagEditing<WorkspaceTag>
  disabled?: boolean
}

/** A tag in the list: a workspace tag, or one the user created here that isn't saved yet. */
type PickerTag = { choice: TagChoice; workspaceTag?: WorkspaceTag }

/** Pick an existing tag or type to create one, with the picked tags beside it; a tag that breaks a rule is explained before the request. */
const TagPicker = ({ value, onChange, workspaceTags, onLimitReached, tagEditing, disabled }: TagPickerProps) => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()

  const newTags = value.filter((choice) => !workspaceTags.some((tag) => sameTagName(tag.name, choice.name)))
  const choices: TagChoice[] = [...newTags, ...workspaceTags.map(({ name, color }) => ({ name, color }))]

  const options: TagOption<PickerTag>[] = [
    ...newTags.map((choice) => ({ value: choice.name, ...choice, tag: { choice } })),
    ...workspaceTags.map((tag) => ({
      value: tag.name,
      name: tag.name,
      color: tag.color,
      contactCount: tag.contactCount,
      tag: { choice: { name: tag.name, color: tag.color }, workspaceTag: tag },
    })),
  ]

  const update = (next: TagChoice[]) => {
    setError(undefined)
    if (next.length > MAX_TAGS_PER_CONTACT) {
      setError(CONTACT_TAG_LIMIT_MESSAGE)
      return
    }
    onChange(next)
  }

  const handleChange = (names: string[]) =>
    update(names.flatMap((name) => choices.find((choice) => choice.name === name) ?? []))

  const handleCreate = (text: string) => {
    const validationError = validateTagName(text)
    if (validationError) {
      setError(validationError)
      return
    }
    const name = normalizeTagName(text)
    if (value.some((choice) => sameTagName(choice.name, name))) return
    const existing = workspaceTags.find((tag) => sameTagName(tag.name, name))
    if (existing) {
      update([...value, { name: existing.name, color: existing.color }])
      return
    }
    const color = pickFreeColor(choices.map((choice) => choice.color))
    if (!color) {
      setError(WORKSPACE_TAG_LIMIT_MESSAGE)
      onLimitReached?.()
      return
    }
    update([...value, { name, color }])
  }

  /** A renamed tag keeps its place in the selection; renaming onto another tag's name takes that tag, as CGW merges them. */
  const renameInValue = (from: TagChoice, name: string, to?: WorkspaceTag) => {
    if (!value.some((choice) => choice.name === from.name)) return
    const renamed = to ? { name: to.name, color: to.color } : { ...from, name }
    const next = value.flatMap((choice) => {
      if (choice.name === from.name) return [renamed]
      return sameTagName(choice.name, name) ? [] : [choice]
    })
    onChange(next)
  }

  const pickerEditing: TagEditing<PickerTag> | undefined = tagEditing && {
    onRename: async ({ choice, workspaceTag }, rawName) => {
      const validationError = validateTagName(rawName)
      if (validationError) return validationError
      const name = normalizeTagName(rawName)
      if (name === choice.name) return undefined
      const target = workspaceTags.find((tag) => tag.id !== workspaceTag?.id && sameTagName(tag.name, name))
      if (workspaceTag) {
        const renameError = await tagEditing.onRename(workspaceTag, name)
        if (renameError) return renameError
      }
      renameInValue(choice, name, target)
      return undefined
    },
    onDelete: async ({ choice, workspaceTag }) => {
      if (workspaceTag) await tagEditing.onDelete(workspaceTag)
      onChange(value.filter((selected) => selected.name !== choice.name))
    },
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={<Button variant="outline" size="sm" disabled={disabled} data-testid="tag-picker" />}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            Tags
            {value.length > 0 && (
              <Badge variant="secondary" size="sm" data-testid="facet-filter-count">
                {value.length}
              </Badge>
            )}
            <ChevronDown className="text-muted-foreground size-4" aria-hidden="true" />
          </PopoverTrigger>

          <PopoverContent align="start" sideOffset={4} className="flex w-72 flex-col gap-1 p-1">
            <TagOptionList
              options={options}
              value={value.map((choice) => choice.name)}
              onChange={handleChange}
              onCreate={handleCreate}
              tagEditing={pickerEditing}
            />

            {value.length > 0 && (
              <div className="border-border border-t pt-1">
                <Button variant="ghost" size="sm" className="w-full" onClick={() => update([])}>
                  Clear
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <TagChips tags={value} />
      </div>
      {error && (
        <p className="text-destructive text-xs" role="alert" data-testid="tag-picker-error">
          {error}
        </p>
      )}
    </div>
  )
}

export default TagPicker
