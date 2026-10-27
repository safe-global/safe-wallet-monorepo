import { useMemo, useState } from 'react'
import type { AddressBookRequestItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import TableCard from '@safe-global/views/components/common/TableCard'
import { SpaceLoadError, SpaceLoading } from '@safe-global/views/features/spaces/components/LoadState'
import AddSuggestionsDialog, {
  type AddedSuggestion,
} from '@safe-global/views/features/spaces/components/AddressBookV2/AddSuggestionsDialog'
import SuggestedContacts, {
  type SuggestionAddLocation,
} from '@safe-global/views/features/spaces/components/AddressBookV2/SuggestedContacts'
import type { SuggestedContact } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import { useUpsertWorkspaceSafeNames, useWorkspaceAddressBookLabel } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getContactsAddedMessage } from '@/utils/addressBookNotifications'
import { WORKSPACE_CONFIRMATION_HIDE_MS } from '../../constants'
import RequestToAddButton from '../SpaceAddressBook/RequestToAddButton'
import { validateContactName } from '../SpaceAddressBook/utils'
import useAddressCellProps from './useAddressCellProps'

type SuggestedTabProps = {
  suggestions: SuggestedContact[]
  isLoading: boolean
  isError: boolean
  onReload: () => void
  isAdmin: boolean
  isInvited: boolean
  isPrivateAddressBookEnabled: boolean
  pendingRequests: AddressBookRequestItemDto[]
  isRequestsSettled: boolean
}

type AddDialog = { suggestions: SuggestedContact[]; location: SuggestionAddLocation }

const countRenamed = (suggestions: SuggestedContact[], contacts: AddedSuggestion[]): number =>
  contacts.filter(
    (contact) => contact.name !== suggestions.find((item) => item.address === contact.address)?.suggestedName,
  ).length

const SuggestedTab = ({
  suggestions,
  isLoading,
  isError,
  onReload,
  isAdmin,
  isInvited,
  isPrivateAddressBookEnabled,
  pendingRequests,
  isRequestsSettled,
}: SuggestedTabProps) => {
  const [dialog, setDialog] = useState<AddDialog>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const addressCellProps = useAddressCellProps()
  const upsertNames = useUpsertWorkspaceSafeNames()
  const bookLabel = useWorkspaceAddressBookLabel()
  const dispatch = useAppDispatch()

  const pendingAddresses = useMemo(
    () => new Set(pendingRequests.map((request) => request.address.toLowerCase())),
    [pendingRequests],
  )

  if (isLoading) {
    return (
      <TableCard>
        <SpaceLoading subject="suggestions" testId="suggestions-loading" />
      </TableCard>
    )
  }

  if (isError) {
    return (
      <TableCard>
        <SpaceLoadError onReload={onReload} testId="suggestions-error" />
      </TableCard>
    )
  }

  const openDialog = (chosen: SuggestedContact[], location: SuggestionAddLocation) => {
    setError(undefined)
    setDialog({ suggestions: chosen, location })
  }

  const closeDialog = () => {
    if (!isSubmitting) setDialog(undefined)
  }

  const handleAdd = async (contacts: AddedSuggestion[]) => {
    if (!dialog) return

    setIsSubmitting(true)
    setError(undefined)
    const result = await upsertNames(contacts).finally(() => setIsSubmitting(false))
    if (result.error) {
      setError(result.error)
      return
    }

    trackEvent(SPACE_EVENTS.SUGGESTED_CONTACTS_ADDED, {
      [MixpanelEventParams.ENTRY_COUNT]: contacts.length,
      [MixpanelEventParams.RENAMED_COUNT]: countRenamed(dialog.suggestions, contacts),
      [MixpanelEventParams.LOCATION]: dialog.location,
    })
    dispatch(
      showNotification({
        message: getContactsAddedMessage(contacts.length, bookLabel),
        variant: 'success',
        groupKey: 'suggested-contacts-added',
        autoHideDuration: WORKSPACE_CONFIRMATION_HIDE_MS,
      }),
    )
    setDialog(undefined)
  }

  const canRequest = !isAdmin && isPrivateAddressBookEnabled && isRequestsSettled && !isInvited

  const renderRequestAction = (suggestion: SuggestedContact, { isCompact }: { isCompact: boolean }) => (
    <RequestToAddButton
      address={suggestion.address}
      name={suggestion.suggestedName}
      chainIds={suggestion.chains.map((chain) => chain.chainId)}
      alreadyRequested={pendingAddresses.has(suggestion.address.toLowerCase())}
      location="suggested"
      isCompact={isCompact}
    />
  )

  return (
    <>
      <TableCard>
        <SuggestedContacts
          suggestions={suggestions}
          canAdd={isAdmin}
          onAdd={openDialog}
          renderRowAction={canRequest ? renderRequestAction : undefined}
          {...addressCellProps}
        />
      </TableCard>

      {dialog && (
        <AddSuggestionsDialog
          suggestions={dialog.suggestions}
          validateName={validateContactName}
          onAdd={handleAdd}
          onClose={closeDialog}
          isSubmitting={isSubmitting}
          error={error}
        />
      )}
    </>
  )
}

export default SuggestedTab
