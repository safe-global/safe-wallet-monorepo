import { useState } from 'react'
import FacetFilter, { type FacetOption } from '@safe-global/views/components/common/FacetFilter'
import { TagChip, TagChips } from './TagChip'
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
  disabled?: boolean
}

/** Pick an existing tag or type to create one, with the picked tags beside it; a tag that breaks a rule is explained before the request. */
const TagPicker = ({ value, onChange, workspaceTags, onLimitReached, disabled }: TagPickerProps) => {
  const [error, setError] = useState<string>()

  const newTags = value.filter((choice) => !workspaceTags.some((tag) => sameTagName(tag.name, choice.name)))
  const choices: TagChoice[] = [...newTags, ...workspaceTags.map(({ name, color }) => ({ name, color }))]

  const options: FacetOption[] = choices.map((choice) => ({
    value: choice.name,
    label: <TagChip name={choice.name} color={choice.color} />,
    searchText: choice.name,
  }))

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

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <FacetFilter
          label="Tags"
          options={options}
          value={value.map((choice) => choice.name)}
          onChange={handleChange}
          onCreate={handleCreate}
          searchable
          searchPlaceholder="Search or create a tag"
          emptyText="No tags yet. Type to create one."
          disabled={disabled}
          data-testid="tag-picker"
        />
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
