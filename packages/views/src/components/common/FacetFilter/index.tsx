import { useMemo, useState, type ReactNode } from 'react'
import { Check, CornerDownLeft, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Input } from '@safe-global/views/components/ui/input'
import { Kbd } from '@safe-global/views/components/ui/kbd'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import { cn } from '@safe-global/views/utils/cn'

export type FacetOption<V extends string = string> = {
  value: V
  label: ReactNode
  /** Rows that carry this value; shown right-aligned and muted. */
  count?: number
  /** Text the search box matches against when `label` is not a plain string. */
  searchText?: string
}

export type FacetOptionListProps<V extends string = string> = {
  /** Names the list for assistive tech, e.g. "Tags". */
  label: string
  options: FacetOption<V>[]
  value: V[]
  onChange: (next: V[]) => void
  /** Show a search box above the options. Defaults to on once there are more than eight. */
  searchable?: boolean
  searchPlaceholder?: string
  emptyText?: string
  /**
   * Called with the current search text when no option matches it. When provided, a
   * "Create '<text>'" row appears; used by the tag picker. Resolves to whether the option was
   * created; the search text stays when it was not.
   */
  onCreate?: (text: string) => Promise<boolean> | boolean
  /** Whether the search text names an existing option, so no "Create" row is offered. Defaults to ignoring case. */
  isSameText?: (a: string, b: string) => boolean
  /** How the "Create" row previews the new option, such as a tag chip. Defaults to the quoted text. */
  renderCreateLabel?: (text: string) => ReactNode
  /**
   * Adds a rename action to each option. Resolves to an error message to keep the editor open, or
   * `undefined` once the rename is done.
   */
  onRenameOption?: (value: V, next: string) => Promise<string | undefined> | string | undefined
  /** Adds a delete action to each option, confirmed inline with `deleteConfirmation`. */
  onDeleteOption?: (value: V) => Promise<void> | void
  deleteConfirmation?: (option: FacetOption<V>) => string
}

const SEARCHABLE_THRESHOLD = 8

const OPTION_ROW =
  'hover:bg-accent focus-visible:bg-accent flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none'

const optionText = (option: FacetOption): string =>
  option.searchText ?? (typeof option.label === 'string' ? option.label : String(option.value))

/** Pinned first and highlighted, so a name that matches nothing reads as something to create. */
const CreateOptionRow = ({ onCreate, children }: { onCreate: () => void; children: ReactNode }) => (
  <li role="none">
    <button
      type="button"
      role="option"
      aria-selected={false}
      onClick={onCreate}
      className={cn(OPTION_ROW, 'bg-accent w-full')}
      data-testid="facet-create-option"
    >
      <Plus className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      <span className="text-muted-foreground shrink-0">Create</span>
      <span className="min-w-0 truncate">{children}</span>
      <Kbd className="ml-auto shrink-0" aria-hidden="true">
        <CornerDownLeft />
      </Kbd>
    </button>
  </li>
)

/**
 * The checkbox list of a facet: optional search, a count per option, optional create, rename and
 * delete. Used inside a popover with other sections.
 */
export function FacetOptionList<V extends string = string>({
  label,
  options,
  value,
  onChange,
  searchable,
  searchPlaceholder = 'Search',
  emptyText = 'No options',
  onCreate,
  isSameText = (a, b) => a.toLowerCase() === b.toLowerCase(),
  renderCreateLabel,
  onRenameOption,
  onDeleteOption,
  deleteConfirmation,
}: FacetOptionListProps<V>) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<{ value: V; draft: string; error?: string }>()
  const [confirmingDelete, setConfirmingDelete] = useState<V>()
  const [isSaving, setIsSaving] = useState(false)
  const hasOptionActions = Boolean(onRenameOption || onDeleteOption)

  const saveRename = async () => {
    if (!editing || !onRenameOption) return
    setIsSaving(true)
    try {
      const error = await onRenameOption(editing.value, editing.draft.trim())
      if (error) setEditing({ ...editing, error })
      else setEditing(undefined)
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async (optionValue: V) => {
    if (!onDeleteOption) return
    setIsSaving(true)
    try {
      await onDeleteOption(optionValue)
      setConfirmingDelete(undefined)
    } finally {
      setIsSaving(false)
    }
  }

  const showSearch = searchable ?? options.length > SEARCHABLE_THRESHOLD

  const visibleOptions = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => optionText(option).toLowerCase().includes(needle))
  }, [options, query])

  const selected = useMemo(() => new Set<string>(value), [value])

  const toggle = (optionValue: V) => {
    const next = selected.has(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]
    onChange(next)
  }

  const trimmedQuery = query.trim()
  const canCreate =
    Boolean(onCreate) &&
    trimmedQuery.length > 0 &&
    !options.some((option) => isSameText(optionText(option), trimmedQuery))

  const handleCreate = async () => {
    if (!canCreate || !onCreate) return
    if (await onCreate(trimmedQuery)) setQuery('')
  }

  return (
    <>
      {showSearch && (
        <SearchInput
          inputSize="default"
          placeholder={searchPlaceholder}
          aria-label={`${searchPlaceholder} ${label.toLowerCase()}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canCreate) {
              event.preventDefault()
              void handleCreate()
            }
          }}
        />
      )}

      <ul role="listbox" aria-multiselectable aria-label={label} className="max-h-64 overflow-y-auto">
        {canCreate && (
          <CreateOptionRow onCreate={() => void handleCreate()}>
            {renderCreateLabel?.(trimmedQuery) ?? <>&lsquo;{trimmedQuery}&rsquo;</>}
          </CreateOptionRow>
        )}
        {visibleOptions.map((option) => {
          const isSelected = selected.has(option.value)
          const text = optionText(option)

          if (editing?.value === option.value) {
            return (
              <li key={option.value} role="none" className="flex flex-col gap-1 px-1 py-1">
                <div className="flex items-center gap-1">
                  <Input
                    inputSize="sm"
                    autoFocus
                    value={editing.draft}
                    aria-label={`Rename ${text}`}
                    aria-invalid={Boolean(editing.error)}
                    disabled={isSaving}
                    onChange={(event) => setEditing({ ...editing, draft: event.target.value, error: undefined })}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void saveRename()
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault()
                        event.stopPropagation()
                        setEditing(undefined)
                      }
                    }}
                    data-testid="facet-option-rename-input"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Save"
                    disabled={isSaving}
                    onClick={() => void saveRename()}
                  >
                    <Check />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Cancel" onClick={() => setEditing(undefined)}>
                    <X />
                  </Button>
                </div>
                {editing.error && (
                  <p role="alert" className="text-destructive px-1 text-xs">
                    {editing.error}
                  </p>
                )}
              </li>
            )
          }

          if (confirmingDelete === option.value) {
            return (
              <li key={option.value} role="none" className="flex flex-col gap-1.5 px-2 py-1.5 text-sm">
                <span>{deleteConfirmation?.(option) ?? `Delete \u2018${text}\u2019?`}</span>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(undefined)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => void confirmDelete(option.value)}
                    data-testid="facet-option-confirm-delete"
                  >
                    Delete
                  </Button>
                </div>
              </li>
            )
          }

          return (
            <li key={option.value} role="none" className="group/option hover:bg-accent flex items-center rounded-sm">
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => toggle(option.value)}
                className={cn(OPTION_ROW, 'min-w-0 flex-1')}
              >
                <Checkbox checked={isSelected} tabIndex={-1} className="pointer-events-none" />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-muted-foreground text-xs tabular-nums">{option.count}</span>
                )}
              </button>
              {hasOptionActions && (
                <span className="flex shrink-0 items-center pr-1 opacity-0 group-focus-within/option:opacity-100 group-hover/option:opacity-100">
                  {onRenameOption && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Rename ${text}`}
                      onClick={() => {
                        setConfirmingDelete(undefined)
                        setEditing({ value: option.value, draft: text })
                      }}
                    >
                      <Pencil />
                    </Button>
                  )}
                  {onDeleteOption && (
                    <Button
                      variant="ghost-destructive"
                      size="icon-xs"
                      aria-label={`Delete ${text}`}
                      onClick={() => {
                        setEditing(undefined)
                        setConfirmingDelete(option.value)
                      }}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </span>
              )}
            </li>
          )
        })}
        {visibleOptions.length === 0 && !canCreate && (
          <li role="none" className="text-muted-foreground px-2 py-2 text-center text-sm">
            {emptyText}
          </li>
        )}
      </ul>
    </>
  )
}
