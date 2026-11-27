import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import PaginatedDataTable, { type DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'
import AddedBy, { EmptyCell } from './AddedBy'
import ChainLogos from './ChainLogos'
import ContactCell, { CONTACT_CELL_MIN_WIDTH } from './ContactCell'
import ContactRowActions from './ContactRowActions'
import RowDetail from './RowDetail'
import { TagChips } from './tags/TagChip'
import type { AddressBookContact } from './types'

export type AddressBookTableProps = {
  contacts: AddressBookContact[]
  /** The workspace book shows Added by; the local book does not have it. */
  book?: 'workspace' | 'local'
  /** The identicon for an address. Defaults to a neutral gradient avatar. */
  renderAvatar?: (address: string) => ReactNode
  /** The block explorer page of an address. Without it the row has no explorer link. */
  getExplorerLink?: (address: string) => { href: string; title: string } | undefined
  /** Each callback adds its item to the row menu; with none there is no menu. */
  onEdit?: (contact: AddressBookContact) => void
  onDelete?: (contact: AddressBookContact) => void
  /** Adds "Edit tags" to the row menu; members get only this. */
  onEditTags?: (contact: AddressBookContact) => void
  /** A control before the row menu, such as "Add to Workspace" on a local contact. */
  renderRowAction?: (contact: AddressBookContact, context: { isCompact: boolean }) => ReactNode
  pageSize?: number
}

const AddTagButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="outline"
    size="chip"
    className="text-muted-foreground border-dashed"
    data-testid="add-tag-button"
    onClick={(event) => {
      event.stopPropagation()
      onClick()
    }}
  >
    <Plus aria-hidden="true" data-icon="inline-start" />
    Add tag
  </Button>
)

const AddressBookTable = ({
  contacts,
  book = 'workspace',
  renderAvatar,
  getExplorerLink,
  onEdit,
  onDelete,
  onEditTags,
  renderRowAction,
  pageSize,
}: AddressBookTableProps) => {
  const chainsColumn: DataTableColumn<AddressBookContact> = {
    id: 'chains',
    header: 'Chains',
    width: 'share',
    priority: 'secondary',
    minWidth: 90,
    sortValue: (contact) => contact.chains.length,
    cell: (contact) => <ChainLogos chains={contact.chains} />,
  }

  const tagsColumn: DataTableColumn<AddressBookContact> = {
    id: 'tags',
    header: 'Tags',
    width: 'share',
    priority: 'secondary',
    // Three short tags on one line
    minWidth: 240,
    sortValue: (contact) => contact.tags?.map((tag) => tag.name.toLowerCase()).sort()[0] ?? null,
    cell: (contact) => {
      if (contact.tags?.length) return <TagChips tags={contact.tags} />
      if (onEditTags) return <AddTagButton onClick={() => onEditTags(contact)} />
      return <EmptyCell />
    },
  }

  const addedByColumn: DataTableColumn<AddressBookContact> = {
    id: 'added-by',
    header: 'Added by',
    width: 'share',
    priority: 'secondary',
    minWidth: 130,
    sortValue: (contact) => contact.addedBy?.toLowerCase() ?? null,
    cell: (contact) => <AddedBy name={contact.addedBy} />,
  }

  const secondaryColumns = book === 'workspace' ? [chainsColumn, tagsColumn, addedByColumn] : [chainsColumn]

  const columns: DataTableColumn<AddressBookContact>[] = [
    {
      id: 'contact',
      header: 'Contact',
      cellTestId: 'table-cell-contact',
      width: 'share',
      sticky: true,
      minWidth: CONTACT_CELL_MIN_WIDTH,
      sortValue: (contact) => contact.name.toLowerCase(),
      cell: (contact, { isCompact }) => (
        <ContactCell
          name={contact.name}
          address={contact.address}
          isLocal={book === 'local'}
          isCompact={isCompact}
          avatar={renderAvatar?.(contact.address)}
          explorerLink={getExplorerLink?.(contact.address)}
        />
      ),
    },
    ...secondaryColumns,
    {
      id: 'actions',
      width: 'fit',
      align: 'end',
      // A row action is a text button that cannot shrink.
      minWidth: renderRowAction ? 240 : 56,
      cell: (contact, { isCompact }) => (
        <span className="inline-flex items-center justify-end gap-1">
          {renderRowAction?.(contact, { isCompact })}
          <ContactRowActions
            name={contact.name}
            onEdit={onEdit && (() => onEdit(contact))}
            onDelete={onDelete && (() => onDelete(contact))}
            onEditTags={onEditTags && (() => onEditTags(contact))}
          />
        </span>
      ),
    },
  ]

  return (
    <PaginatedDataTable
      columns={columns}
      rows={contacts}
      getRowKey={(contact) => contact.address}
      getRowClassName={(contact) => (contact.isShared ? 'opacity-50' : '')}
      renderRowDetail={(contact) => <RowDetail row={contact} columns={secondaryColumns} />}
      pageSize={pageSize}
    />
  )
}

export default AddressBookTable
