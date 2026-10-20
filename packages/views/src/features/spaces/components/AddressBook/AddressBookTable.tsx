import type { ReactNode } from 'react'
import { Avatar, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import PaginatedDataTable, { type DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'
import ChainLogos from './ChainLogos'
import ContactCell from './ContactCell'
import ContactRowActions from './ContactRowActions'
import { tagSortValue } from './filters'
import { allTagsOf, systemTagTitles } from './tags/systemTags'
import { TagChips } from './tags/TagChip'
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
      <span className="min-w-0 truncate text-sm">{name}</span>
    </span>
  ) : (
    <span className="text-muted-foreground text-xs">&mdash;</span>
  )

const Tags = ({ contact }: { contact: AddressBookContact }) => {
  if (contact.isLocal) return <span className="text-muted-foreground text-xs">Workspace only</span>
  const tags = allTagsOf(contact)
  return tags.length > 0 ? (
    <TagChips tags={tags} titles={systemTagTitles(contact)} />
  ) : (
    <span className="text-muted-foreground text-xs">&mdash;</span>
  )
}

export type AddressBookTableProps = {
  contacts: AddressBookContact[]
  permissions: AddressBookPermissions
  /** The workspace book shows Tags and Added by; the local book does not have them. */
  book?: 'workspace' | 'local'
  /** The identicon for an address. Defaults to a neutral gradient avatar. */
  renderAvatar?: (address: string) => ReactNode
  onEdit?: (contact: AddressBookContact) => void
  onEditTags?: (contact: AddressBookContact) => void
  onDelete?: (contact: AddressBookContact) => void
  pageSize?: number
  /** Row checkboxes for the bulk bar. Selection is keyed by address and owned by the caller. */
  selectedAddresses?: ReadonlySet<string>
  onSelectionChange?: (next: Set<string>) => void
}

/**
 * The address book table. Every column but the actions sorts, and the sort icons show at rest.
 * Below the summed column minimums it goes compact: Contact and actions stay, the rest folds into
 * an expandable row detail.
 */
const AddressBookTable = ({
  contacts,
  permissions,
  book = 'workspace',
  renderAvatar,
  onEdit,
  onEditTags,
  onDelete,
  pageSize,
  selectedAddresses,
  onSelectionChange,
}: AddressBookTableProps) => {
  const isWorkspace = book === 'workspace'

  const columns: DataTableColumn<AddressBookContact>[] = [
    {
      id: 'contact',
      header: 'Contact',
      cellTestId: 'table-cell-contact',
      width: isWorkspace ? '35%' : '40%',
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
        />
      ),
    },
    {
      id: 'chains',
      header: 'Chains',
      width: isWorkspace ? '10%' : '15%',
      priority: 'secondary',
      minWidth: 90,
      sortValue: (contact) => contact.chains.length,
      cell: (contact) => <ChainLogos chains={contact.chains} />,
    },
    ...(isWorkspace
      ? ([
          {
            id: 'tags',
            header: 'Tags',
            cellTestId: 'table-cell-tags',
            width: '35%',
            priority: 'secondary',
            minWidth: 220,
            sortValue: tagSortValue,
            cell: (contact) => <Tags contact={contact} />,
          },
          {
            id: 'added-by',
            header: 'Added by',
            width: '15%',
            priority: 'secondary',
            minWidth: 120,
            sortValue: (contact) => contact.addedBy?.toLowerCase() ?? null,
            cell: (contact) => <AddedBy name={contact.addedBy} />,
          },
        ] satisfies DataTableColumn<AddressBookContact>[])
      : []),
    {
      id: 'actions',
      width: '5%',
      align: 'end',
      minWidth: 56,
      cell: (contact) => (
        <ContactRowActions
          name={contact.name}
          permissions={permissions}
          onEdit={() => onEdit?.(contact)}
          onEditTags={() => onEditTags?.(contact)}
          onDelete={() => onDelete?.(contact)}
        />
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
          <dt className="text-muted-foreground">Tags</dt>
          <dd>
            <Tags contact={contact} />
          </dd>
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
      renderRowDetail={renderRowDetail}
      pageSize={pageSize}
      showSortIcons
      selectable={Boolean(onSelectionChange)}
      selectedKeys={selectedAddresses}
      onSelectionChange={onSelectionChange}
      getSelectionLabel={(contact) => `Select ${contact.name}`}
    />
  )
}

export default AddressBookTable
