import { useMemo, useState } from 'react'
import FacetFilter, { type FacetOption } from '@safe-global/views/components/common/FacetFilter'
import { TagChip } from './TagChip'
import { MAX_TAGS_PER_CONTACT, dedupeTags, hasTag, validateTag } from './tagRules'
import type { TagCount } from '../types'

type TagPickerProps = {
  value: string[]
  onChange: (next: string[]) => void
  /** Distinct tags in the book; the picker adds any selected tag that is not in the book yet. */
  options: TagCount[]
  label?: string
  disabled?: boolean
  /** Hide the count column, e.g. in a dialog where usage counts are noise. */
  showCounts?: boolean
  'data-testid'?: string
}

/**
 * The tag editor: the same searchable multi-select as the filter dropdowns, plus a "Create" row.
 * Validation mirrors the gateway so a rejected tag is explained before the request.
 */
const TagPicker = ({
  value,
  onChange,
  options,
  label = 'Tags',
  disabled,
  showCounts = true,
  'data-testid': testId = 'tag-picker',
}: TagPickerProps) => {
  const [error, setError] = useState<string>()

  const facetOptions = useMemo<FacetOption[]>(() => {
    const known = options.map(({ tag, count }) => ({
      value: tag,
      label: <TagChip tag={tag} />,
      searchText: tag,
      count: showCounts ? count : undefined,
    }))
    const extra = value
      .filter((tag) => !options.some((option) => option.tag.toLowerCase() === tag.toLowerCase()))
      .map((tag) => ({ value: tag, label: <TagChip tag={tag} />, searchText: tag }))
    return [...extra, ...known]
  }, [options, value, showCounts])

  const handleChange = (next: string[]) => {
    setError(undefined)
    if (next.length > MAX_TAGS_PER_CONTACT) {
      setError(`A contact can have at most ${MAX_TAGS_PER_CONTACT} tags`)
      return
    }
    onChange(dedupeTags(next))
  }

  const handleCreate = (text: string) => {
    const tag = text.trim()
    const validationError = validateTag(tag)
    if (validationError) {
      setError(validationError)
      return
    }
    // Reuse the book's spelling when the tag already exists with a different case.
    const existing = options.find((option) => option.tag.toLowerCase() === tag.toLowerCase())?.tag
    const chosen = existing ?? tag
    if (hasTag(value, chosen)) return
    handleChange([...value, chosen])
  }

  return (
    <div className="flex flex-col gap-1">
      <FacetFilter
        label={label}
        options={facetOptions}
        value={value}
        onChange={handleChange}
        onCreate={handleCreate}
        searchable
        searchPlaceholder="Search or create a tag"
        emptyText="No tags yet. Type to create one."
        disabled={disabled}
        data-testid={testId}
      />
      {error && (
        <p className="text-destructive text-xs" role="alert" data-testid="tag-picker-error">
          {error}
        </p>
      )}
    </div>
  )
}

export default TagPicker
