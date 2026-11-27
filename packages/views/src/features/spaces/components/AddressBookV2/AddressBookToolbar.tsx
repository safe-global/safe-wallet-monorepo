import type { ReactNode } from 'react'
import { SearchInput } from '@safe-global/views/components/ui/search-input'

export type AddressBookToolbarProps = {
  query: string
  onQueryChange: (query: string) => void
  /** Beside the search, such as the Filters dropdown. */
  filters?: ReactNode
  actions?: ReactNode
}

/** One row above the table: the search fills the row, the filters sit beside it, the actions on the right. */
const AddressBookToolbar = ({ query, onQueryChange, filters, actions }: AddressBookToolbarProps) => (
  <div className="flex flex-wrap items-center gap-2" data-testid="address-book-toolbar">
    {/* `default` (h-9) matches the `size="action"` buttons on this row. */}
    <SearchInput
      inputSize="default"
      className="min-w-60 flex-1 sm:w-auto"
      placeholder="Search by name or address"
      aria-label="Search contacts by name or address"
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      onClear={() => onQueryChange('')}
    />
    {filters}
    {actions && <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{actions}</div>}
  </div>
)

export default AddressBookToolbar
