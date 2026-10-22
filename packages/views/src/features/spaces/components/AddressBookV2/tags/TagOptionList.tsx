import { FacetOptionList, type FacetOption } from '@safe-global/views/components/common/FacetFilter'
import { TagChip } from './TagChip'
import type { TagColor } from './tagColor'

export type TagEditing<T> = {
  /** Resolves to an error message to keep the editor open, or `undefined` once renamed. */
  onRename: (tag: T, name: string) => Promise<string | undefined> | string | undefined
  onDelete: (tag: T) => Promise<void> | void
}

export type TagOption<T> = {
  value: string
  name: string
  color?: TagColor
  /** Contacts that have the tag; a tag being created has none. */
  contactCount?: number
  tag: T
}

type TagOptionListProps<T> = {
  options: TagOption<T>[]
  value: string[]
  onChange: (next: string[]) => void
  /** Adds a "Create" row for a name no option has. */
  onCreate?: (text: string) => void
  /** Rename and delete; without it the tags are read-only. */
  tagEditing?: TagEditing<T>
}

const deleteConfirmation = (name: string, contactCount = 0): string =>
  contactCount > 0
    ? `Delete ‘${name}’ from ${contactCount} ${contactCount === 1 ? 'contact' : 'contacts'}?`
    : `Delete ‘${name}’?`

const SectionHeading = ({ children }: { children: string }) => (
  <p className="text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium">{children}</p>
)

/** The tag list the Filters dropdown and the tag picker share: search, tick, rename and delete. */
function TagOptionList<T>({ options, value, onChange, onCreate, tagEditing }: TagOptionListProps<T>) {
  const optionOf = (optionValue: string) => options.find((option) => option.value === optionValue)

  const facetOptions: FacetOption[] = options.map((option) => ({
    value: option.value,
    label: <TagChip name={option.name} color={option.color} />,
    searchText: option.name,
    count: option.contactCount,
  }))

  return (
    <>
      <SectionHeading>Tags</SectionHeading>
      <FacetOptionList
        label="Tags"
        options={facetOptions}
        value={value}
        onChange={onChange}
        onCreate={onCreate}
        searchable
        searchPlaceholder={onCreate ? 'Search or create a tag' : 'Search tags'}
        emptyText={onCreate ? 'No tags yet. Type to create one.' : 'No tags yet'}
        onRenameOption={
          tagEditing &&
          ((optionValue, name) => {
            const option = optionOf(optionValue)
            return option ? tagEditing.onRename(option.tag, name) : undefined
          })
        }
        onDeleteOption={
          tagEditing &&
          (async (optionValue) => {
            const option = optionOf(optionValue)
            if (option) await tagEditing.onDelete(option.tag)
          })
        }
        deleteConfirmation={(facetOption) => {
          const option = optionOf(facetOption.value)
          return deleteConfirmation(option?.name ?? String(facetOption.searchText), option?.contactCount)
        }}
      />
    </>
  )
}

export default TagOptionList
