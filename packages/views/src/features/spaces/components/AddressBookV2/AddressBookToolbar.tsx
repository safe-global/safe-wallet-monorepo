import type { ReactNode } from 'react'
import { SearchInput } from '@safe-global/views/components/ui/search-input'

export type AddressBookToolbarProps = {
  query: string
  onQueryChange: (query: string) => void
  /** What the search matches, e.g. "name, address or tag". */
  searchScope?: string
  /** Beside the search, such as the Filters dropdown. */
  filters?: ReactNode
  actions?: ReactNode
}

/** One row above the table: the search fills the row, the filters sit beside it, the actions on the right. */
const AddressBookToolbar = ({
  query,
  onQueryChange,
  searchScope = 'name or address',
  filters,
  actions,
}: AddressBookToolbarProps) => (
  <div className="flex flex-wrap items-center gap-3" data-testid="address-book-toolbar">
    {/* `lg` (h-10) matches the Safe accounts page, whose search and buttons share one height. */}
    <SearchInput
      inputSize="lg"
      className="min-w-60 flex-1 sm:w-auto"
      placeholder={`Search by ${searchScope}`}
      aria-label={`Search contacts by ${searchScope}`}
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      onClear={() => onQueryChange('')}
    />
    {filters}
    {actions && <div className="ml-auto flex flex-wrap items-center justify-end gap-3">{actions}</div>}
  </div>
)

export default AddressBookToolbar
