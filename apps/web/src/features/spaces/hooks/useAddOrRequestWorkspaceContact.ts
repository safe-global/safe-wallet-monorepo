import { useCallback } from 'react'
import { useAddressBookRequestsCreateRequestV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { type AnalyticsEvent, trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, type SPACE_LABELS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useAppDispatch } from '@/store'
import { type AlertColor, showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { WORKSPACE_CONFIRMATION_HIDE_MS } from '../constants'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useSpaceAddressBookState } from './useGetSpaceAddressBook'
import { useIsAdmin, useIsInvited } from './useSpaceMembers'
import { useUpsertWorkspaceSafeNames, type WorkspaceSafeName } from './useUpsertWorkspaceSafeName'

/** `pending`: the member already has an open request for this address, so nothing new was sent. */
export type WorkspaceContactResult = 'added' | 'requested' | 'pending' | 'skipped' | 'failed'

type Outcome = { result: WorkspaceContactResult; error?: string }

type Confirmation = { event?: AnalyticsEvent; variant: AlertColor; groupKey: string; message: string }

const CONFIRMATIONS: Partial<Record<WorkspaceContactResult, Confirmation>> = {
  added: {
    event: SPACE_EVENTS.ADDRESS_BOOK_ENTRY_CREATED,
    variant: 'success',
    groupKey: 'add-to-workspace-success',
    message: 'Contact added to Workspace address book',
  },
  requested: {
    event: SPACE_EVENTS.ADDRESS_REQUEST_SENT,
    variant: 'info',
    groupKey: 'request-to-add-success',
    message: 'This contact will be added to the Workspace address book on admin approval',
  },
  pending: {
    variant: 'info',
    groupKey: 'request-to-add-pending',
    message: 'A request to add this contact to the Workspace address book is already pending admin approval',
  },
}

/**
 * Adds a contact to the Workspace address book for admins and requests it for members.
 */
export const useAddOrRequestWorkspaceContact = (
  source?: SPACE_LABELS,
): ((contact: WorkspaceSafeName) => Promise<WorkspaceContactResult>) => {
  const spaceId = useCurrentSpaceId()
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()
  const { items } = useSpaceAddressBookState()
  const upsertWorkspaceNames = useUpsertWorkspaceSafeNames()
  const [createRequest] = useAddressBookRequestsCreateRequestV1Mutation()
  const dispatch = useAppDispatch()

  const submit = useCallback(
    async (spaceId: string, contact: WorkspaceSafeName): Promise<Outcome> => {
      if (isAdmin) {
        const { error } = await upsertWorkspaceNames([contact])
        return error ? { result: 'failed', error } : { result: 'added' }
      }

      const { error } = await createRequest({ spaceId, createAddressBookRequestDto: contact })
      if (!error) return { result: 'requested' }
      if ('status' in error && error.status === 409) return { result: 'pending' }
      return { result: 'failed', error: getRtkQueryErrorMessage(error) }
    },
    [isAdmin, upsertWorkspaceNames, createRequest],
  )

  return useCallback(
    async ({ address, name: rawName, chainIds }) => {
      const name = sanitizeName(rawName)
      const shared = items.find((item) => sameAddress(item.address, address))
      const isShared = shared?.name === name && chainIds.every((chainId) => shared.chainIds.includes(chainId))
      if (!name || !spaceId || isInvited || isShared) return 'skipped'

      const { result, error } = await submit(spaceId, { address, name, chainIds })
      const confirmation = CONFIRMATIONS[result]
      if (confirmation) {
        const { event, ...notification } = confirmation
        if (event && source) trackEvent(event, { [MixpanelEventParams.SOURCE]: source })
        else if (event) trackEvent(event)
        dispatch(showNotification({ ...notification, autoHideDuration: WORKSPACE_CONFIRMATION_HIDE_MS }))
      }
      if (error) dispatch(showNotification({ variant: 'error', groupKey: 'workspace-contact-error', message: error }))

      return result
    },
    [items, spaceId, isInvited, submit, source, dispatch],
  )
}
