import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import type { SpaceAddressBookItemDto, SpaceAddressBookTagDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import TableCard from '@safe-global/views/components/common/TableCard'
import { Button } from '@safe-global/views/components/ui/button'
import { SpaceLoadError, SpaceLoading } from '@safe-global/views/features/spaces/components/LoadState'
import AddressBookEmptyState from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookEmptyState'
import AddressBookTable from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookTable'
import AddressBookToolbar from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookToolbar'
import TagFilterDropdown from '@safe-global/views/features/spaces/components/AddressBookV2/tags/TagFilterDropdown'
import EditTagsDialog from '@safe-global/views/features/spaces/components/AddressBookV2/EditTagsDialog'
import { existingTagIds } from '@safe-global/views/features/spaces/components/AddressBookV2/tags/TagMenu'
import { filterByTags, searchContacts } from '@safe-global/views/features/spaces/components/AddressBookV2/search'
import type { AddressBookContact } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import Track from '@/components/common/Track'
import { useCurrentSpaceId } from '../../public/useCurrentSpaceId'
import { useMemberNameResolver } from '../../public/useMemberNameResolver'
import useChains from '@/hooks/useChains'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { downloadCsv, spaceAddressBookToCsv } from '../../utils/addressBookCsv'
import AddContact from '../SpaceAddressBook/AddContact'
import DeleteContactDialog from '../SpaceAddressBook/DeleteContactDialog'
import EditContactDialog from '../SpaceAddressBook/EditContactDialog'
import ImportAddressBook from '../SpaceAddressBook/Import'
import useAddressCellProps from './useAddressCellProps'
import useTagActions from './useTagActions'
import { tagNamesOf, toWorkspaceContacts } from './utils'

// The entry is read from `items` on each render, so a tag renamed, merged or deleted in a dialog shows at once
type OpenDialog = { type: 'edit' | 'delete' | 'tags'; address: string }

const trackTagLimitReached = (location: 'filters' | 'row_menu' | 'add_contact' | 'edit_contact') =>
  trackEvent(SPACE_EVENTS.TAG_LIMIT_REACHED, { [MixpanelEventParams.LOCATION]: location })

type WorkspaceContactsProps = {
  items: SpaceAddressBookItemDto[]
  tags: SpaceAddressBookTagDto[]
  isLoading: boolean
  isError: boolean
  onReload: () => void
  isAdmin: boolean
  isInvited: boolean
}

const WorkspaceContacts = ({
  items,
  tags,
  isLoading,
  isError,
  onReload,
  isAdmin,
  isInvited,
}: WorkspaceContactsProps) => {
  const [query, setQuery] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [dialog, setDialog] = useState<OpenDialog>()
  const [tagsError, setTagsError] = useState<string>()
  const { saveContactTags, isSavingContactTags, tagActions } = useTagActions()
  const { configs } = useChains()
  const addressCellProps = useAddressCellProps()
  const resolveMemberName = useMemberNameResolver()
  const spaceId = useCurrentSpaceId()

  const contacts = useMemo(
    () => toWorkspaceContacts(items, tags, configs, resolveMemberName),
    [items, tags, configs, resolveMemberName],
  )
  // A deleted tag drops out of the filters
  const activeTagIds = useMemo(() => existingTagIds(selectedTagIds, tags), [selectedTagIds, tags])
  const visibleContacts = useMemo(
    () => filterByTags(searchContacts(contacts, query), activeTagIds),
    [contacts, query, activeTagIds],
  )

  const dialogEntry = dialog && items.find((item) => item.address === dialog.address)
  // A contact deleted elsewhere closes its dialog for good, so re-adding it doesn't reopen it
  useEffect(() => {
    if (dialog && !dialogEntry) setDialog(undefined)
  }, [dialog, dialogEntry])

  const openDialog = (type: OpenDialog['type'], contact: AddressBookContact) =>
    setDialog({ type, address: contact.address })

  const handleEdit = (contact: AddressBookContact) => {
    trackEvent(SPACE_EVENTS.EDIT_ADDRESS)
    openDialog('edit', contact)
  }

  const handleDelete = (contact: AddressBookContact) => {
    trackEvent(SPACE_EVENTS.REMOVE_ADDRESS)
    openDialog('delete', contact)
  }

  const handleEditTags = (contact: AddressBookContact) => {
    setTagsError(undefined)
    openDialog('tags', contact)
  }

  const handleSaveTags = async (entry: SpaceAddressBookItemDto, tagIds: number[]) => {
    setTagsError(undefined)
    const { saved, error } = await saveContactTags(entry.address, tagNamesOf(tagIds, tags))
    setTagsError(error)
    if (saved) setDialog(undefined)
  }

  const memberTagActions = isInvited ? undefined : tagActions

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
      <AddContact
        label="Add contact"
        workspaceTags={tags}
        onTagLimitReached={() => trackTagLimitReached('add_contact')}
      />
    </Track>
  )

  const exportButton = (
    <Track {...SPACE_EVENTS.EXPORT_ADDRESS_BOOK}>
      <Button variant="outline" size="action" onClick={handleExport}>
        <Download aria-hidden="true" data-icon="inline-start" />
        Export
      </Button>
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
        filters={
          <TagFilterDropdown
            tags={tags}
            value={activeTagIds}
            onChange={setSelectedTagIds}
            actions={memberTagActions}
            onLimitReached={() => trackTagLimitReached('filters')}
            onFiltersChanged={(ids) =>
              trackEvent(SPACE_EVENTS.CONTACTS_FILTERED, { [MixpanelEventParams.TAG_COUNT]: ids.length })
            }
          />
        }
        actions={
          isAdmin ? (
            <>
              <ImportAddressBook />
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
          <AddressBookEmptyState
            kind="no-results"
            onClearSearch={() => {
              setQuery('')
              setSelectedTagIds([])
            }}
          />
        ) : (
          <AddressBookTable
            contacts={visibleContacts}
            {...addressCellProps}
            onEdit={isAdmin ? handleEdit : undefined}
            onDelete={isAdmin ? handleDelete : undefined}
            onEditTags={isInvited ? undefined : handleEditTags}
          />
        )}
      </TableCard>

      {dialog?.type === 'edit' && dialogEntry && (
        <EditContactDialog
          entry={dialogEntry}
          workspaceTags={tags}
          onTagLimitReached={() => trackTagLimitReached('edit_contact')}
          onClose={() => setDialog(undefined)}
        />
      )}
      {dialog?.type === 'tags' && dialogEntry && (
        <EditTagsDialog
          contact={dialogEntry}
          workspaceTags={tags}
          onSave={(tagIds) => handleSaveTags(dialogEntry, tagIds)}
          onClose={() => setDialog(undefined)}
          onLimitReached={() => trackTagLimitReached('row_menu')}
          tagActions={memberTagActions}
          isSubmitting={isSavingContactTags}
          error={tagsError}
        />
      )}
      {dialog?.type === 'delete' && dialogEntry && (
        <DeleteContactDialog
          name={dialogEntry.name}
          address={dialogEntry.address}
          networks={dialogEntry.chainIds}
          onClose={() => setDialog(undefined)}
        />
      )}
    </div>
  )
}

export default WorkspaceContacts
