import { useMemo, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Input } from '@safe-global/views/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
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
   * "Create '<text>'" row appears; used by the tag picker.
   */
  onCreate?: (text: string) => void
  /**
   * Adds a rename action to each option. Resolves to an error message to keep the editor open, or
   * `undefined` once the rename is done.
   */
  onRenameOption?: (value: V, next: string) => Promise<string | undefined> | string | undefined
  /** Adds a delete action to each option, confirmed inline with `deleteConfirmation`. */
  onDeleteOption?: (value: V) => Promise<void> | void
  deleteConfirmation?: (option: FacetOption<V>) => string
}

export type FacetFilterProps<V extends string = string> = FacetOptionListProps<V> & {
  disabled?: boolean
  'data-testid'?: string
}

const SEARCHABLE_THRESHOLD = 8

const optionText = (option: FacetOption): string =>
  option.searchText ?? (typeof option.label === 'string' ? option.label : String(option.value))

/**
 * The checkbox list of a facet: optional search, a count per option, optional create, rename and
 * delete. Used alone inside a popover with several sections, or through `FacetFilter`.
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
    !options.some((option) => optionText(option).toLowerCase() === trimmedQuery.toLowerCase())

  const handleCreate = () => {
    if (!canCreate || !onCreate) return
    onCreate(trimmedQuery)
    setQuery('')
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
              handleCreate()
            }
          }}
        />
      )}

      <ul role="listbox" aria-multiselectable aria-label={label} className="max-h-64 overflow-y-auto">
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
                className={cn(
                  'hover:bg-accent focus-visible:bg-accent flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none',
                )}
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
        {canCreate && (
          <li role="none">
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={handleCreate}
              className="hover:bg-accent focus-visible:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none"
            >
              <span className="text-muted-foreground">Create</span>
              <span className="truncate">&lsquo;{trimmedQuery}&rsquo;</span>
            </button>
          </li>
        )}
        {visibleOptions.length === 0 && !canCreate && (
          <li role="none" className="text-muted-foreground px-2 py-2 text-center text-sm">
            {emptyText}
          </li>
        )}
      </ul>
    </>
  )
}

/**
 * A searchable multi-select with checkboxes and a count per option, in its own dropdown. Selection
 * does not close the popover, so several options can be ticked in a row.
 */
function FacetFilter<V extends string = string>({
  disabled,
  'data-testid': testId,
  ...listProps
}: FacetFilterProps<V>) {
  const [open, setOpen] = useState(false)
  const { label, value, onChange } = listProps

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" size="sm" disabled={disabled} data-testid={testId} />}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label}
        {value.length > 0 && (
          <Badge variant="secondary" size="sm" data-testid="facet-filter-count">
            {value.length}
          </Badge>
        )}
        <ChevronDown className="text-muted-foreground size-4" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={4} className="flex w-64 flex-col gap-1 p-1">
        <FacetOptionList {...listProps} />

        {value.length > 0 && (
          <div className="border-border border-t pt-1">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange([])}>
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default FacetFilter
