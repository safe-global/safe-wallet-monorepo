import { Fragment, type ReactNode } from 'react'
import { isAddress } from 'ethers'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Avatar, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import PaginatedDataTable, { type DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'
import TruncatedText from '@safe-global/views/components/common/AccountRow/TruncatedText'
import { getInitials } from '@safe-global/views/components/common/AccountRow/utils'
import ChainLogos from './ChainLogos'
import ContactCell from './ContactCell'
import ContactRowActions from './ContactRowActions'
import type { AddressBookContact } from './types'

const AddedBy = ({ name }: { name?: string }) =>
  name ? (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Avatar size="xs">
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      <TruncatedText
        variant="paragraph-small"
        className="min-w-0"
        text={isAddress(name) ? shortenAddress(name) : name}
        fullText={isAddress(name) ? name : undefined}
      />
    </span>
  ) : (
    <span className="text-muted-foreground text-xs">&mdash;</span>
  )

export type AddressBookTableProps = {
  contacts: AddressBookContact[]
  /** The workspace book shows Added by; the local book does not have it. */
  book?: 'workspace' | 'local'
  /** The identicon for an address. Defaults to a neutral gradient avatar. */
  renderAvatar?: (address: string) => ReactNode
  /** The block explorer page of an address. Without it the row has no explorer link. */
  getExplorerLink?: (address: string) => { href: string; title: string } | undefined
  /** Each callback adds its item to the row menu; with neither there is no menu. */
  onEdit?: (contact: AddressBookContact) => void
  onDelete?: (contact: AddressBookContact) => void
  /** A control before the row menu, such as "Add to Workspace" on a local contact. */
  renderRowAction?: (contact: AddressBookContact, context: { isCompact: boolean }) => ReactNode
  pageSize?: number
}

const AddressBookTable = ({
  contacts,
  book = 'workspace',
  renderAvatar,
  getExplorerLink,
  onEdit,
  onDelete,
  renderRowAction,
  pageSize,
}: AddressBookTableProps) => {
  const chainsColumn: DataTableColumn<AddressBookContact> = {
    id: 'chains',
    header: 'Chains',
    width: '20%',
    priority: 'secondary',
    minWidth: 90,
    sortValue: (contact) => contact.chains.length,
    cell: (contact) => <ChainLogos chains={contact.chains} />,
  }

  const addedByColumn: DataTableColumn<AddressBookContact> = {
    id: 'added-by',
    header: 'Added by',
    width: '20%',
    priority: 'secondary',
    minWidth: 120,
    sortValue: (contact) => contact.addedBy?.toLowerCase() ?? null,
    cell: (contact) => <AddedBy name={contact.addedBy} />,
  }

  const secondaryColumns = book === 'workspace' ? [chainsColumn, addedByColumn] : [chainsColumn]

  const columns: DataTableColumn<AddressBookContact>[] = [
    {
      id: 'contact',
      header: 'Contact',
      cellTestId: 'table-cell-contact',
      width: '40%',
      sticky: true,
      // The full address in monospace needs this much; below it the table goes compact.
      minWidth: 360,
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
          />
        </span>
      ),
    },
  ]

  const renderRowDetail = (contact: AddressBookContact) => (
    <dl className="grid grid-cols-[5rem_1fr] items-center gap-x-2 gap-y-2 text-sm">
      {secondaryColumns.map((column) => (
        <Fragment key={column.id}>
          <dt className="text-muted-foreground">{column.header}</dt>
          <dd>{column.cell(contact, { isCompact: true })}</dd>
        </Fragment>
      ))}
    </dl>
  )

  return (
    <PaginatedDataTable
      columns={columns}
      rows={contacts}
      getRowKey={(contact) => contact.address}
      getRowClassName={(contact) => (contact.isShared ? 'opacity-50' : '')}
      renderRowDetail={renderRowDetail}
      pageSize={pageSize}
    />
  )
}

export default AddressBookTable
