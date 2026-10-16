import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import TableCard from '@safe-global/views/components/common/TableCard'
import { Button } from '@safe-global/views/components/ui/button'
import { SpaceLoadError, SpaceLoading } from '@safe-global/views/features/spaces/components/LoadState'
import AddressBookEmptyState from '@safe-global/views/features/spaces/components/AddressBook/AddressBookEmptyState'
import AddressBookTable from '@safe-global/views/features/spaces/components/AddressBook/AddressBookTable'
import AddressBookToolbar from '@safe-global/views/features/spaces/components/AddressBook/AddressBookToolbar'
import { filterContacts } from '@safe-global/views/features/spaces/components/AddressBook/filters'
import {
  FULL_PERMISSIONS,
  NO_PERMISSIONS,
  type AddressBookContact,
} from '@safe-global/views/features/spaces/components/AddressBook/types'
import Identicon from '@/components/common/Identicon'
import Track from '@/components/common/Track'
import { useCurrentSpaceId, useMemberNameResolver } from '@/features/spaces'
import useChains from '@/hooks/useChains'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { downloadCsv, spaceAddressBookToCsv } from '../../utils/addressBookCsv'
import AddContact from '../SpaceAddressBook/AddContact'
import DeleteContactDialog from '../SpaceAddressBook/DeleteContactDialog'
import EditContactDialog from '../SpaceAddressBook/EditContactDialog'
import ImportAddressBook from '../SpaceAddressBook/Import'
import { toWorkspaceContacts } from './utils'

type OpenDialog = { type: 'edit' | 'delete'; entry: SpaceAddressBookItemDto }

type WorkspaceContactsProps = {
  items: SpaceAddressBookItemDto[]
  isLoading: boolean
  isError: boolean
  onReload: () => void
  isAdmin: boolean
}

const renderAvatar = (address: string) => <Identicon address={address} size={24} />

const WorkspaceContacts = ({ items, isLoading, isError, onReload, isAdmin }: WorkspaceContactsProps) => {
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<OpenDialog>()
  const { configs } = useChains()
  const resolveMemberName = useMemberNameResolver()
  const spaceId = useCurrentSpaceId()

  const contacts = useMemo(
    () => toWorkspaceContacts(items, configs, resolveMemberName),
    [items, configs, resolveMemberName],
  )
  const visibleContacts = useMemo(() => filterContacts(contacts, query), [contacts, query])

  const openDialog = (type: OpenDialog['type'], contact: AddressBookContact) => {
    const entry = items.find((item) => item.address === contact.address)
    if (entry) setDialog({ type, entry })
  }

  const handleEdit = (contact: AddressBookContact) => {
    trackEvent(SPACE_EVENTS.EDIT_ADDRESS)
    openDialog('edit', contact)
  }

  const handleDelete = (contact: AddressBookContact) => {
    trackEvent(SPACE_EVENTS.REMOVE_ADDRESS)
    openDialog('delete', contact)
  }

  const handleExport = () => downloadCsv(`workspace-${spaceId}-address-book.csv`, spaceAddressBookToCsv(items))

  if (isLoading) {
    return (
      <TableCard>
        <SpaceLoading subject="contacts" testId="address-book-loading" />
      </TableCard>
    )
  }

  if (isError) {
    return (
      <TableCard>
        <SpaceLoadError onReload={onReload} testId="address-book-error" />
      </TableCard>
    )
  }

  const addContact = (
    <Track {...SPACE_EVENTS.ADD_ADDRESS}>
      <AddContact label="Add contact" />
    </Track>
  )

  if (items.length === 0) {
    return (
      <TableCard>
        <AddressBookEmptyState
          kind="empty"
          book="workspace"
          actions={
            isAdmin ? (
              <>
                <ImportAddressBook />
                {addContact}
              </>
            ) : undefined
          }
        />
      </TableCard>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <AddressBookToolbar
        query={query}
        onQueryChange={setQuery}
        actions={
          <>
            {isAdmin && <ImportAddressBook />}
            <Button variant="outline" size="action" onClick={handleExport}>
              <Download aria-hidden="true" data-icon="inline-start" />
              Export
            </Button>
            {isAdmin && addContact}
          </>
        }
      />

      <TableCard>
        {visibleContacts.length === 0 ? (
          <AddressBookEmptyState kind="no-results" onClearSearch={() => setQuery('')} />
        ) : (
          <AddressBookTable
            contacts={visibleContacts}
            permissions={isAdmin ? FULL_PERMISSIONS : NO_PERMISSIONS}
            renderAvatar={renderAvatar}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </TableCard>

      {dialog?.type === 'edit' && <EditContactDialog entry={dialog.entry} onClose={() => setDialog(undefined)} />}
      {dialog?.type === 'delete' && (
        <DeleteContactDialog
          name={dialog.entry.name}
          address={dialog.entry.address}
          networks={dialog.entry.chainIds}
          onClose={() => setDialog(undefined)}
        />
      )}
    </div>
  )
}

export default WorkspaceContacts
