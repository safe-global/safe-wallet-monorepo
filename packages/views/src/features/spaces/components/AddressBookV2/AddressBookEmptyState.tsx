import type { ReactNode } from 'react'
import { BookUser, HardDrive, SearchX } from 'lucide-react'
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
  | { kind: 'no-results'; onClearSearch: () => void }
  | { kind: 'empty'; book: 'workspace' | 'local'; actions?: ReactNode }

const EMPTY_BOOK = {
  workspace: {
    icon: <BookUser />,
    title: 'No contacts yet',
    description:
      'Name the addresses your team pays, trusts and signs with. Everyone in the Workspace sees the same names.',
  },
  local: {
    icon: <HardDrive />,
    title: 'No local contacts yet',
    description: 'Contacts you add here are stored in this browser only.',
  },
}

const AddressBookEmptyState = (props: AddressBookEmptyStateProps) => {
  if (props.kind === 'no-results') {
    return (
      <Empty data-testid="address-book-no-results">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>No contacts match</EmptyTitle>
          <EmptyDescription>Try another name or address.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={props.onClearSearch}>
            Clear search
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const { icon, title, description } = EMPTY_BOOK[props.book]

  return (
    <Empty data-testid="address-book-empty">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {props.actions && <EmptyContent className="flex-row justify-center">{props.actions}</EmptyContent>}
    </Empty>
  )
}

export default AddressBookEmptyState
