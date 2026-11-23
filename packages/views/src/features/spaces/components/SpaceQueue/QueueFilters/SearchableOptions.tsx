import { useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'
import { SearchInput } from '@safe-global/views/components/ui/search-input'

type SearchableOptionsProps<T> = {
  items: T[]
  /** Plural, for the field's placeholder and label: "Search networks". */
  noun: string
  /** The text a search matches against. */
  getText: (item: T) => string
  /** Renders the options that match the search. */
  children: (shown: T[]) => ReactNode
}

const MENU_ITEM_SELECTOR = '[role^="menuitem"]'

const hasModifier = (event: KeyboardEvent): boolean => event.ctrlKey || event.metaKey || event.altKey

const isPrintableKey = (event: KeyboardEvent): boolean =>
  event.key.length === 1 && event.key !== ' ' && !hasModifier(event)

const isDeleteKey = (event: KeyboardEvent): boolean =>
  (event.key === 'Backspace' || event.key === 'Delete') && !hasModifier(event)

export const filterOptions = <T,>(items: T[], getText: (item: T) => string, search: string): T[] => {
  const query = search.trim().toLowerCase()
  return query ? items.filter((item) => getText(item).toLowerCase().includes(query)) : items
}

/**
 * A filter menu's options under a search field. The field stays put while the options scroll.
 * Typing or deleting on an option moves to the field, Arrow Down leaves it for the first option and Arrow Up on the first option comes back.
 */
const SearchableOptions = <T,>({ items, noun, getText, children }: SearchableOptionsProps<T>): ReactElement => {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const shown = filterOptions(items, getText, search)

  const focusSearch = () => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  }

  const getFirstOption = () => listRef.current?.querySelector<HTMLElement>(MENU_ITEM_SELECTOR)

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Escape still reaches the menu, to close it.
    if (event.key === 'Escape') return
    // The menu takes every other key: printable ones for its typeahead, arrows to move between options.
    event.stopPropagation()
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      getFirstOption()?.focus()
    }
  }

  const onOptionsKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target === inputRef.current) return
    if (isPrintableKey(event)) {
      // The key's character lands in the field once it has the focus.
      event.stopPropagation()
      focusSearch()
    } else if (isDeleteKey(event)) {
      // The caret goes to the end of the field, where only Backspace has a character to remove.
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Backspace') setSearch((current) => current.slice(0, -1))
      focusSearch()
    } else if (event.key === 'ArrowUp' && event.target === getFirstOption()) {
      event.preventDefault()
      event.stopPropagation()
      focusSearch()
    }
  }

  return (
    <div onKeyDownCapture={onOptionsKeyDownCapture}>
      <SearchInput
        ref={inputRef}
        variant="surface"
        className="m-1 w-[calc(100%-0.5rem)]"
        placeholder={`Search ${noun}`}
        aria-label={`Search ${noun}`}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onClear={() => {
          setSearch('')
          inputRef.current?.focus()
        }}
        onKeyDown={onSearchKeyDown}
        autoComplete="off"
      />
      <div ref={listRef} className="max-h-72 overflow-y-auto">
        {shown.length > 0 ? (
          children(shown)
        ) : (
          <p role="status" className="px-2 py-1.5 text-sm text-muted-foreground">
            No matches
          </p>
        )}
      </div>
    </div>
  )
}

export default SearchableOptions
