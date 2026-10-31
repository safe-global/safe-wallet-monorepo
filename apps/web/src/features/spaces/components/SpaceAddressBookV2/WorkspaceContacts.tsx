import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import TableCard from '@safe-global/views/components/common/TableCard'
import { Button } from '@safe-global/views/components/ui/button'
import { SpaceLoadError, SpaceLoading } from '@safe-global/views/features/spaces/components/LoadState'
import AddressBookEmptyState from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookEmptyState'
import AddressBookTable from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookTable'
import AddressBookToolbar from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookToolbar'
import { searchContacts } from '@safe-global/views/features/spaces/components/AddressBookV2/search'
import type { AddressBookContact } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import { CsvExportDialog } from '@/components/address-book/ExportDialog'
import Track from '@/components/common/Track'
import { useCurrentSpaceId, useMemberNameResolver } from '@/features/spaces'
import useChains from '@/hooks/useChains'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { spaceAddressBookToCsvRows } from '../../utils/addressBookCsv'
import AddContact from '../SpaceAddressBook/AddContact'
import DeleteContactDialog from '../SpaceAddressBook/DeleteContactDialog'
import EditContactDialog from '../SpaceAddressBook/EditContactDialog'
import ImportWorkspaceCsv from './ImportWorkspaceCsv'
import useAddressCellProps from './useAddressCellProps'
import { toWorkspaceContacts } from './utils'

type OpenDialog = { type: 'edit' | 'delete'; entry: SpaceAddressBookItemDto }

type WorkspaceContactsProps = {
  items: SpaceAddressBookItemDto[]
  isLoading: boolean
  isError: boolean
  onReload: () => void
  isAdmin: boolean
  isInvited: boolean
}

const WorkspaceContacts = ({ items, isLoading, isError, onReload, isAdmin, isInvited }: WorkspaceContactsProps) => {
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<OpenDialog>()
  const [isExportOpen, setIsExportOpen] = useState(false)
  const { configs } = useChains()
  const addressCellProps = useAddressCellProps()
  const resolveMemberName = useMemberNameResolver()
  const spaceId = useCurrentSpaceId()

  const contacts = useMemo(
    () => toWorkspaceContacts(items, configs, resolveMemberName),
    [items, configs, resolveMemberName],
  )
  const visibleContacts = useMemo(() => searchContacts(contacts, query), [contacts, query])

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

  const exportButton = (
    <Button variant="outline" size="action" onClick={() => setIsExportOpen(true)}>
      <Download aria-hidden="true" data-icon="inline-start" />
      Export
    </Button>
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
                <ImportWorkspaceCsv items={items} />
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
          isAdmin ? (
            <>
              <ImportWorkspaceCsv items={items} />
              {exportButton}
              {addContact}
            </>
          ) : isInvited ? undefined : (
            exportButton
          )
        }
      />

      <TableCard>
        {visibleContacts.length === 0 ? (
          <AddressBookEmptyState kind="no-results" onClearSearch={() => setQuery('')} />
        ) : (
          <AddressBookTable
            contacts={visibleContacts}
            {...addressCellProps}
            onEdit={isAdmin ? handleEdit : undefined}
            onDelete={isAdmin ? handleDelete : undefined}
          />
        )}
      </TableCard>

      {isExportOpen && (
        <CsvExportDialog
          csvData={spaceAddressBookToCsvRows(items)}
          filename={`workspace-${spaceId}-address-book`}
          onExport={() => trackEvent(SPACE_EVENTS.EXPORT_ADDRESS_BOOK)}
          handleClose={() => setIsExportOpen(false)}
        />
      )}
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
