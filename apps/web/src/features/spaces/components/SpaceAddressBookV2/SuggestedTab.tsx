import { useMemo, useState } from 'react'
import TableCard from '@safe-global/views/components/common/TableCard'
import { SpaceLoadError, SpaceLoading } from '@safe-global/views/features/spaces/components/LoadState'
import AddSuggestionsDialog, {
  type AddedSuggestion,
} from '@safe-global/views/features/spaces/components/AddressBookV2/AddSuggestionsDialog'
import AddressBookEmptyState from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookEmptyState'
import AddressBookToolbar from '@safe-global/views/features/spaces/components/AddressBookV2/AddressBookToolbar'
import { searchSuggestions } from './search'
import SuggestedContacts, {
  type SuggestionAddLocation,
} from '@safe-global/views/features/spaces/components/AddressBookV2/SuggestedContacts'
import type { SuggestedContact } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import { useUpsertWorkspaceSafeNames } from '../../public/hooks/useUpsertWorkspaceSafeName'
import { useWorkspaceAddressBookLabel } from '../../public/hooks/useWorkspaceAddressBookLabel'
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
}: SuggestedTabProps) => {
  const [dialog, setDialog] = useState<AddDialog>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const [query, setQuery] = useState('')
  const visibleSuggestions = useMemo(() => searchSuggestions(suggestions, query), [suggestions, query])
  const addressCellProps = useAddressCellProps()
  const upsertNames = useUpsertWorkspaceSafeNames()
  const bookLabel = useWorkspaceAddressBookLabel()
  const dispatch = useAppDispatch()

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

  const canRequest = !isAdmin && isPrivateAddressBookEnabled && !isInvited

  const renderRequestAction = (suggestion: SuggestedContact, { isCompact }: { isCompact: boolean }) => (
    <RequestToAddButton
      address={suggestion.address}
      name={suggestion.suggestedName}
      chainIds={suggestion.chains.map((chain) => chain.chainId)}
      location="suggested"
      isCompact={isCompact}
    />
  )

  return (
    <div className="flex flex-col gap-4">
      {suggestions.length > 0 && (
        <AddressBookToolbar query={query} onQueryChange={setQuery} searchScope="name, address or Safe" />
      )}

      <TableCard>
        {suggestions.length > 0 && visibleSuggestions.length === 0 ? (
          <AddressBookEmptyState kind="no-results" book="suggested" onClear={() => setQuery('')} />
        ) : (
          <SuggestedContacts
            suggestions={visibleSuggestions}
            canAdd={isAdmin}
            onAdd={openDialog}
            renderRowAction={canRequest ? renderRequestAction : undefined}
            {...addressCellProps}
          />
        )}
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
    </div>
  )
}

export default SuggestedTab
