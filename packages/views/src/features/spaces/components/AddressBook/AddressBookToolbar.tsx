import { Download, FileUp, Plus } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { ButtonGroup } from '@safe-global/views/components/ui/button-group'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import ContactFiltersDropdown, { type ContactFiltersDropdownProps } from './ContactFiltersDropdown'
import { activeFilterCount } from './filters'
import { EMPTY_FILTERS, type AddressBookPermissions } from './types'

export type AddressBookToolbarProps = ContactFiltersDropdownProps & {
  permissions: Pick<AddressBookPermissions, 'canAdd' | 'canImport'>
  onImport?: () => void
  onExport?: () => void
  exportDisabled?: boolean
  onAddContact?: () => void
}

/**
 * One row above the table: search fills the row, Filters sits beside it, then Import · Export as one
 * button group and "Add contact" as the only primary action, rightmost.
 */
const AddressBookToolbar = ({
  permissions,
  onImport,
  onExport,
  exportDisabled = false,
  onAddContact,
  ...filterProps
}: AddressBookToolbarProps) => {
  const { filters, onFiltersChange } = filterProps
  const isFiltered = Boolean(filters.query) || activeFilterCount(filters) > 0

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="address-book-toolbar">
      {/* `lg` (h-10) matches the Safe accounts page, whose search and buttons share one height. */}
      <SearchInput
        inputSize="lg"
        className="min-w-60 flex-1 sm:w-auto"
        placeholder="Search by name, address or tag"
        aria-label="Search contacts by name, address or tag"
        value={filters.query}
        onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
      />
      <ContactFiltersDropdown {...filterProps} />
      {isFiltered && (
        <Button variant="ghost" size="lg" onClick={() => onFiltersChange(EMPTY_FILTERS)} data-testid="clear-filters">
          Clear
        </Button>
      )}

      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
        <ButtonGroup>
          {permissions.canImport && (
            <Button variant="outline" size="lg" onClick={onImport}>
              <FileUp aria-hidden="true" data-icon="inline-start" />
              Import
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={onExport}
            disabled={exportDisabled}
            data-testid="export-address-book"
          >
            <Download aria-hidden="true" data-icon="inline-start" />
            Export
          </Button>
        </ButtonGroup>

        {permissions.canAdd && (
          <Button size="lg" onClick={onAddContact} data-testid="add-contact">
            <Plus aria-hidden="true" data-icon="inline-start" className="text-green-500" />
            Add contact
          </Button>
        )}
      </div>
    </div>
  )
}

export default AddressBookToolbar
