import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import type { AddressBookRequestItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import TableCard from '@safe-global/views/components/common/TableCard'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import AddressBookEmptyState from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookEmptyState'
import AddressBookTable from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookTable'
import AddressBookToolbar from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookToolbar'
import { searchContacts } from '@safe-global/views/features/spaces/components/AddressBookV2/search'
import type { AddressBookContact } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import EntryDialog from '@/components/address-book/EntryDialog'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { useAppDispatch, type AppThunk } from '@/store'
import { removeAddressBookEntry, selectAllAddressBooks, type AddressBookState } from '@/store/addressBookSlice'
import AddLocalContact from '../SpaceAddressBook/AddLocalContact'
import AddToWorkspaceButton from '../SpaceAddressBook/AddToWorkspaceButton'
import RequestToAddButton from '../SpaceAddressBook/RequestToAddButton'
import DeleteLocalContactDialog from './DeleteLocalContactDialog'
import useAddressCellProps from './useAddressCellProps'
import { staleCasingKeys } from './utils'

type OpenDialog =
  | { type: 'edit'; contact: AddressBookContact; before: AddressBookState }
  | { type: 'delete'; contact: AddressBookContact }

type LocalContactsProps = {
  contacts: AddressBookContact[]
  /** Until the workspace book is read, "already shared" cannot be told from "not shared yet". */
  isWorkspaceSettled: boolean
  pendingRequests: AddressBookRequestItemDto[]
  isRequestsSettled: boolean
  isAdmin: boolean
  isInvited: boolean
}

const chainIdsOf = (contact: AddressBookContact) => contact.chains.map((chain) => chain.chainId)

const removeStaleCasings =
  (contact: AddressBookContact, before: AddressBookState): AppThunk =>
  (dispatch, getState) => {
    const after = selectAllAddressBooks(getState())
    for (const key of staleCasingKeys(before, after, contact.address, chainIdsOf(contact))) {
      dispatch(removeAddressBookEntry(key))
    }
  }

const AlreadyShared = ({ isCompact }: { isCompact: boolean }) => (
  <Tooltip>
    <TooltipTrigger render={<span className="inline-flex" />}>
      {isCompact ? (
        <>
          <Check aria-hidden="true" className="text-muted-foreground size-4" />
          <span className="sr-only">Already shared</span>
        </>
      ) : (
        <Badge variant="secondary">Already shared</Badge>
      )}
    </TooltipTrigger>
    <TooltipContent>Already saved in your Workspace address book</TooltipContent>
  </Tooltip>
)

const LocalContacts = ({
  contacts,
  isWorkspaceSettled,
  pendingRequests,
  isRequestsSettled,
  isAdmin,
  isInvited,
}: LocalContactsProps) => {
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<OpenDialog>()
  const addressCellProps = useAddressCellProps()
  const localBooks = useAllAddressBooks()
  const dispatch = useAppDispatch()

  const visibleContacts = useMemo(() => searchContacts(contacts, query), [contacts, query])
  const pendingAddresses = useMemo(
    () => new Set(pendingRequests.map((request) => request.address.toLowerCase())),
    [pendingRequests],
  )

  const renderShareAction = (contact: AddressBookContact, { isCompact }: { isCompact: boolean }) => {
    if (!isWorkspaceSettled) return null
    if (contact.isShared) return <AlreadyShared isCompact={isCompact} />

    const shareProps = { address: contact.address, name: contact.name, chainIds: chainIdsOf(contact), isCompact }
    if (isAdmin) return <AddToWorkspaceButton {...shareProps} />
    // Invitees cannot propose contacts, and an unread request list would offer to request an open request again
    if (isInvited || !isRequestsSettled) return null
    return <RequestToAddButton {...shareProps} alreadyRequested={pendingAddresses.has(contact.address.toLowerCase())} />
  }

  const closeDialog = () => setDialog(undefined)

  const closeEditDialog = (contact: AddressBookContact, before: AddressBookState) => {
    dispatch(removeStaleCasings(contact, before))
    closeDialog()
  }

  if (contacts.length === 0) {
    return (
      <TableCard>
        <AddressBookEmptyState kind="empty" book="local" actions={<AddLocalContact />} />
      </TableCard>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <AddressBookToolbar query={query} onQueryChange={setQuery} actions={<AddLocalContact />} />

      <TableCard>
        {visibleContacts.length === 0 ? (
          <AddressBookEmptyState kind="no-results" onClearSearch={() => setQuery('')} />
        ) : (
          <AddressBookTable
            contacts={visibleContacts}
            book="local"
            {...addressCellProps}
            onEdit={(contact) => setDialog({ type: 'edit', contact, before: localBooks })}
            onDelete={(contact) => setDialog({ type: 'delete', contact })}
            renderRowAction={renderShareAction}
          />
        )}
      </TableCard>

      {dialog?.type === 'edit' && (
        <EntryDialog
          handleClose={() => closeEditDialog(dialog.contact, dialog.before)}
          defaultValues={{ name: dialog.contact.name, address: dialog.contact.address }}
          disableAddressInput
          chainIds={chainIdsOf(dialog.contact)}
        />
      )}
      {dialog?.type === 'delete' && (
        <DeleteLocalContactDialog name={dialog.contact.name} address={dialog.contact.address} onClose={closeDialog} />
      )}
    </div>
  )
}

export default LocalContacts
