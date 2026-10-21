import type { ReactNode } from 'react'
import { isAddress } from 'ethers'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Avatar, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import PaginatedDataTable, { type DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'
import ChainLogos from './ChainLogos'
import ContactCell from './ContactCell'
import ContactRowActions from './ContactRowActions'
import type { AddressBookContact, AddressBookPermissions } from './types'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

const AddedBy = ({ name }: { name?: string }) =>
  name ? (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Avatar size="xs">
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <Tooltip>
        <TooltipTrigger render={<span className="min-w-0 truncate text-left text-sm" />}>
          {isAddress(name) ? shortenAddress(name) : name}
        </TooltipTrigger>
        <TooltipContent align="start">{name}</TooltipContent>
      </Tooltip>
    </span>
  ) : (
    <span className="text-muted-foreground text-xs">&mdash;</span>
  )

export type AddressBookTableProps = {
  contacts: AddressBookContact[]
  permissions: AddressBookPermissions
  /** The workspace book shows Added by; the local book does not have it. */
  book?: 'workspace' | 'local'
  /** The identicon for an address. Defaults to a neutral gradient avatar. */
  renderAvatar?: (address: string) => ReactNode
  /** The block explorer page of an address. Without it the row has no explorer link. */
  getExplorerLink?: (address: string) => { href: string; title: string } | undefined
  onEdit?: (contact: AddressBookContact) => void
  onDelete?: (contact: AddressBookContact) => void
  /** A control before the row menu, such as "Add to Workspace" on a local contact. */
  renderRowAction?: (contact: AddressBookContact, context: { isCompact: boolean }) => ReactNode
  pageSize?: number
}

/**
 * The address book table: Contact (name and full address) · Chains · Added by · ⋮. Below the summed
 * column minimums it goes compact: Contact and the actions stay, the rest folds into a row detail.
 */
const AddressBookTable = ({
  contacts,
  permissions,
  book = 'workspace',
  renderAvatar,
  getExplorerLink,
  onEdit,
  onDelete,
  renderRowAction,
  pageSize,
}: AddressBookTableProps) => {
  const isWorkspace = book === 'workspace'

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
          isLocal={contact.isLocal}
          isCompact={isCompact}
          avatar={renderAvatar?.(contact.address)}
          explorerLink={getExplorerLink?.(contact.address)}
        />
      ),
    },
    {
      id: 'chains',
      header: 'Chains',
      width: '20%',
      priority: 'secondary',
      minWidth: 90,
      sortValue: (contact) => contact.chains.length,
      cell: (contact) => <ChainLogos chains={contact.chains} />,
    },
    ...(isWorkspace
      ? ([
          {
            id: 'added-by',
            header: 'Added by',
            width: '20%',
            priority: 'secondary',
            minWidth: 120,
            sortValue: (contact) => contact.addedBy?.toLowerCase() ?? null,
            cell: (contact) => <AddedBy name={contact.addedBy} />,
          },
        ] satisfies DataTableColumn<AddressBookContact>[])
      : []),
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
            permissions={permissions}
            onEdit={() => onEdit?.(contact)}
            onDelete={() => onDelete?.(contact)}
          />
        </span>
      ),
    },
  ]

  // The compact layout drops the secondary columns; this row detail brings them back per row.
  const renderRowDetail = (contact: AddressBookContact) => (
    <dl className="grid grid-cols-[5rem_1fr] items-center gap-x-2 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Chains</dt>
      <dd>
        <ChainLogos chains={contact.chains} />
      </dd>
      {isWorkspace && (
        <>
          <dt className="text-muted-foreground">Added by</dt>
          <dd>
            <AddedBy name={contact.addedBy} />
          </dd>
        </>
      )}
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
