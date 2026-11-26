import { useId, useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@safe-global/views/components/ui/input-group'
import { usePortalContainerElement } from '@safe-global/views/components/ui/ShadcnProvider'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Typography } from '@safe-global/views/components/ui/typography'
import { useAnchoredList } from '@safe-global/views/hooks/use-anchored-list'
import { cn } from '@safe-global/views/utils/cn'
import {
  RETRY_LABEL,
  SELECT_ALL_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'

export type SearchPickerItem = {
  id: string
  label: string
  /** Right after the label, e.g. an info mark. */
  labelSuffix?: ReactNode
  detail?: string
  /** The detail is an address, so it's set in the code font. */
  isDetailAddress?: boolean
  icon: ReactNode
  /** Also matched by the search, e.g. a token's address. */
  searchText?: string
}

export type SearchPickerGroup = { id: string; header?: ReactNode; items: SearchPickerItem[] }

type SearchPickerNotice = { text: string; onRetry?: () => void }

export type SearchPickerProps = {
  placeholder: string
  groups: SearchPickerGroup[]
  /** The ids of the picked items. */
  selected: readonly string[]
  onToggle: (item: SearchPickerItem) => void
  query: string
  onQueryChange: (query: string) => void
  /** Shown when nothing matches the query. */
  emptyLabel: string
  /** An option built from the query, e.g. a pasted address: listed first, unfiltered. */
  extraItem?: SearchPickerItem
  /** Why the query offers nothing to pick, e.g. a pasted address that can't be added. */
  notice?: SearchPickerNotice
  /** Adds a Select all row over the listed items; `isSelecting` is false when they're all picked already. */
  onSelectAll?: (ids: string[], isSelecting: boolean) => void
  isLoading?: boolean
  disabled?: boolean
  'data-testid'?: string
}

const SKELETON_ROW_COUNT = 3

const OPTION_ROW = 'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted'

const matches = ({ id, label, detail, searchText }: SearchPickerItem, search: string): boolean =>
  !search || [label, detail, searchText, id].join(' ').toLowerCase().includes(search)

/** A persistent search field: focusing it lists everything, typing filters, and the list stays open to pick several. */
const SearchPicker = ({
  placeholder,
  groups,
  selected,
  onToggle,
  query,
  onQueryChange,
  emptyLabel,
  extraItem,
  notice,
  onSelectAll,
  isLoading = false,
  disabled = false,
  'data-testid': testId,
}: SearchPickerProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const anchorRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const portalContainer = usePortalContainerElement()
  const isListOpen = isOpen && !disabled
  const listStyle = useAnchoredList(anchorRef, isListOpen)

  const search = query.trim().toLowerCase()
  const results = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.id !== extraItem?.id && matches(item, search)),
    }))
    .filter(({ items }) => items.length > 0)
  const options = [...(extraItem ? [extraItem] : []), ...results.flatMap(({ items }) => items)]
  const listedIds = results.flatMap(({ items }) => items.map(({ id }) => id))
  const pickedCount = listedIds.filter((id) => selected.includes(id)).length
  const isAllPicked = listedIds.length > 0 && pickedCount === listedIds.length
  const optionId = (item: SearchPickerItem) => `${listId}-${options.indexOf(item)}`
  const activeOption = options[activeIndex]

  const pick = (item: SearchPickerItem) => {
    onToggle(item)
    if (item !== extraItem) return
    // A typed option is done once picked, so the field is ready for the next search
    onQueryChange('')
    setActiveIndex(-1)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (options.length === 0) return
        event.preventDefault()
        setIsOpen(true)
        const step = event.key === 'ArrowDown' ? 1 : -1
        setActiveIndex((current) => Math.min(Math.max(current + step, 0), options.length - 1))
        return
      }
      case 'Enter': {
        const target = activeOption ?? options[0]
        if (!isListOpen || !target) return
        event.preventDefault()
        pick(target)
        return
      }
      case 'Escape': {
        // Stops here, or the enclosing tx modal closes too; with the list shut it falls through
        if (!isListOpen) return
        event.preventDefault()
        event.stopPropagation()
        setIsOpen(false)
      }
    }
  }

  const renderOption = (item: SearchPickerItem) => {
    const isPicked = selected.includes(item.id)
    return (
      <button
        key={item.id}
        id={optionId(item)}
        type="button"
        role="option"
        aria-selected={isPicked}
        tabIndex={-1}
        onClick={() => pick(item)}
        className={cn(OPTION_ROW, item === activeOption && 'bg-muted')}
      >
        <Checkbox checked={isPicked} tabIndex={-1} className="pointer-events-none" />
        <span className="flex size-6 shrink-0 overflow-hidden rounded-full">{item.icon}</span>
        <span className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-1">
            <span className="truncate">{item.label}</span>
            {item.labelSuffix}
          </span>
          {item.detail && (
            <span className={cn('truncate text-xs text-muted-foreground', item.isDetailAddress && 'font-mono')}>
              {item.detail}
            </span>
          )}
        </span>
      </button>
    )
  }

  const list = (
    <div
      className={cn(
        'z-[var(--z-overlay)] overflow-y-auto rounded-lg border border-border bg-card px-1 pb-1 text-foreground shadow-lg',
        '[scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]',
      )}
      style={listStyle}
      // Keeps focus in the field, so the list stays open while picking several
      onMouseDown={(event) => event.preventDefault()}
      data-testid={testId && `${testId}-list`}
    >
      {notice && (
        <div role="alert" className="flex items-center justify-between gap-2 px-3 pt-2 pb-1">
          <Typography variant="paragraph-small" className="text-destructive">
            {notice.text}
          </Typography>
          {notice.onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={notice.onRetry}>
              {RETRY_LABEL}
            </Button>
          )}
        </div>
      )}

      {onSelectAll && listedIds.length > 1 && (
        <button
          type="button"
          onClick={() => onSelectAll(listedIds, !isAllPicked)}
          className={cn(OPTION_ROW, 'mt-1 rounded-none border-b border-border py-2.5 font-medium')}
        >
          <Checkbox
            checked={isAllPicked}
            indeterminate={pickedCount > 0 && !isAllPicked}
            tabIndex={-1}
            className="pointer-events-none"
          />
          {SELECT_ALL_LABEL}
        </button>
      )}

      <div id={listId} role="listbox" aria-multiselectable aria-label={placeholder}>
        {extraItem && <div className="pt-1">{renderOption(extraItem)}</div>}
        {results.map(({ id, header, items }) => (
          <div key={id} role="group" aria-labelledby={header ? `${listId}-${id}` : undefined}>
            {/* Solid to the list's top edge, so rows scrolling up never show above the header */}
            {header ? (
              <div id={`${listId}-${id}`} className="sticky top-0 z-10 bg-card pt-1">
                {header}
              </div>
            ) : (
              <div className="pt-1" />
            )}
            {items.map(renderOption)}
          </div>
        ))}
      </div>

      {isLoading && (
        <div aria-busy className="flex flex-col pt-1" data-testid="search-picker-loading">
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <div key={index} className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="size-4 rounded-[4px]" />
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !notice && options.length === 0 && (
        <Typography variant="paragraph-small" color="muted" className="px-3 pt-2 pb-1">
          {emptyLabel}
        </Typography>
      )}
    </div>
  )

  return (
    <>
      <InputGroup
        ref={anchorRef}
        variant="surface"
        inputSize="lg"
        fieldError="hidden"
        data-disabled={disabled}
        className="data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-muted"
      >
        <InputGroupAddon align="inline-start">
          <Search className="size-4" aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value)
            setActiveIndex(-1)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setIsOpen(false)
            setActiveIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          role="combobox"
          aria-expanded={isListOpen}
          aria-controls={isListOpen ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={isListOpen && activeOption ? optionId(activeOption) : undefined}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          data-testid={testId}
        />
      </InputGroup>

      {isListOpen && createPortal(list, portalContainer ?? document.body)}
    </>
  )
}

export default SearchPicker
