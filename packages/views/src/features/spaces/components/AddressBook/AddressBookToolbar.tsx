import { Download, FileUp, Plus, Users } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { ButtonGroup } from '@safe-global/views/components/ui/button-group'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import ContactFiltersDropdown, { type ContactFiltersDropdownProps } from './ContactFiltersDropdown'
import { activeFilterCount } from './filters'
import { EMPTY_FILTERS, type AddressBookPermissions } from './types'

export type AddressBookToolbarProps = ContactFiltersDropdownProps & {
  permissions: Pick<AddressBookPermissions, 'canAdd' | 'canImport'>
  /** Workspace signers not in the book yet. "Import signers" shows only while this is above zero. */
  missingSignerCount?: number
  onImport?: () => void
  onExport?: () => void
  exportDisabled?: boolean
  onImportSigners?: () => void
  onAddContact?: () => void
}

/**
 * One row above the table: search fills the row, Filters sits beside it, then Import · Export ·
 * Import signers as one button group and "Add contact" as the only primary action, rightmost.
 */
const AddressBookToolbar = ({
  permissions,
  missingSignerCount = 0,
  onImport,
  onExport,
  exportDisabled = false,
  onImportSigners,
  onAddContact,
  ...filterProps
}: AddressBookToolbarProps) => {
  const { filters, onFiltersChange } = filterProps
  const isFiltered = Boolean(filters.query) || activeFilterCount(filters) > 0

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="address-book-toolbar">
      {/* `sm` (h-8) matches the `size="sm"` buttons on this row. */}
      <SearchInput
        inputSize="sm"
        className="min-w-60 flex-1 sm:w-auto"
        placeholder="Search by name, address or tag"
        aria-label="Search contacts by name, address or tag"
        value={filters.query}
        onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
      />
      <ContactFiltersDropdown {...filterProps} />
      {isFiltered && (
        <Button variant="ghost" size="sm" onClick={() => onFiltersChange(EMPTY_FILTERS)} data-testid="clear-filters">
          Clear
        </Button>
      )}

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        <ButtonGroup>
          {permissions.canImport && (
            <Button variant="outline" size="sm" onClick={onImport}>
              <FileUp aria-hidden="true" data-icon="inline-start" />
              Import
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={exportDisabled}
            data-testid="export-address-book"
          >
            <Download aria-hidden="true" data-icon="inline-start" />
            Export
          </Button>
          {permissions.canAdd && missingSignerCount > 0 && (
            <Button variant="outline" size="sm" onClick={onImportSigners} data-testid="import-all-signers">
              <Users aria-hidden="true" data-icon="inline-start" />
              Import signers
              <Badge variant="secondary" size="sm">
                {missingSignerCount}
              </Badge>
            </Button>
          )}
        </ButtonGroup>

        {permissions.canAdd && (
          <Button size="sm" onClick={onAddContact} data-testid="add-contact">
            <Plus aria-hidden="true" data-icon="inline-start" />
            Add contact
          </Button>
        )}
      </div>
    </div>
  )
}

export default AddressBookToolbar
