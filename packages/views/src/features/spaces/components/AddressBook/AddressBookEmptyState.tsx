import { BookUser, FileUp, Plus, SearchX } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@safe-global/views/components/ui/empty'

type AddressBookEmptyStateProps =
  | { kind: 'no-results'; onClearFilters: () => void }
  | { kind: 'empty'; canAdd: boolean; onAddContact?: () => void; onImport?: () => void }

/** Inside the table card: a book with no contacts yet, or a search and filters that match none. */
const AddressBookEmptyState = (props: AddressBookEmptyStateProps) => {
  if (props.kind === 'no-results') {
    return (
      <Empty data-testid="address-book-no-results">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>No contacts match</EmptyTitle>
          <EmptyDescription>Try another name, address or tag, or clear the filters.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={props.onClearFilters}>
            Clear filters
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <Empty data-testid="address-book-empty">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BookUser />
        </EmptyMedia>
        <EmptyTitle>No contacts yet</EmptyTitle>
        <EmptyDescription>
          Name the addresses your team pays, trusts and signs with. Everyone in the workspace sees the same names.
        </EmptyDescription>
      </EmptyHeader>
      {props.canAdd && (
        <EmptyContent className="flex-row justify-center">
          <Button variant="outline" size="sm" onClick={props.onImport}>
            <FileUp aria-hidden="true" data-icon="inline-start" />
            Import
          </Button>
          <Button size="sm" onClick={props.onAddContact}>
            <Plus aria-hidden="true" data-icon="inline-start" />
            Add contact
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

export default AddressBookEmptyState
