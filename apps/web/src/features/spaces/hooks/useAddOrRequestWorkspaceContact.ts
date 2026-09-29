import { useCallback } from 'react'
import { useAddressBookRequestsCreateRequestV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, type SPACE_LABELS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useSpaceAddressBookState } from './useGetSpaceAddressBook'
import { useIsAdmin, useIsInvited } from './useSpaceMembers'
import { useUpsertWorkspaceSafeNames, type WorkspaceSafeName } from './useUpsertWorkspaceSafeName'

/** Adds a contact to the Workspace address book for admins and requests it for members. Errors show as a toast. */
export const useAddOrRequestWorkspaceContact = (
  source: SPACE_LABELS,
): ((contact: WorkspaceSafeName) => Promise<void>) => {
  const spaceId = useCurrentSpaceId()
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()
  const { items } = useSpaceAddressBookState()
  const upsertWorkspaceNames = useUpsertWorkspaceSafeNames()
  const [createRequest] = useAddressBookRequestsCreateRequestV1Mutation()
  const dispatch = useAppDispatch()

  const submit = useCallback(
    async (contact: WorkspaceSafeName): Promise<string | undefined> => {
      const trackParams = { [MixpanelEventParams.SOURCE]: source }

      if (isAdmin) {
        const { error } = await upsertWorkspaceNames([contact])
        if (!error) trackEvent(SPACE_EVENTS.ADDRESS_BOOK_ENTRY_CREATED, trackParams)
        return error
      }
      if (!spaceId) return

      const { error } = await createRequest({ spaceId, createAddressBookRequestDto: contact })
      if (!error) {
        trackEvent(SPACE_EVENTS.ADDRESS_REQUEST_SENT, trackParams)
        return
      }
      // 409: a request for this address is already pending
      return 'status' in error && error.status === 409 ? undefined : getRtkQueryErrorMessage(error)
    },
    [source, isAdmin, spaceId, upsertWorkspaceNames, createRequest],
  )

  return useCallback(
    async ({ address, name: rawName, chainIds }) => {
      const name = sanitizeName(rawName)
      const shared = items.find((item) => sameAddress(item.address, address))
      const isShared = shared?.name === name && chainIds.every((chainId) => shared.chainIds.includes(chainId))
      if (!name || !spaceId || isInvited || isShared) return

      const error = await submit({ address, name, chainIds })
      if (error) dispatch(showNotification({ variant: 'error', groupKey: 'workspace-contact-error', message: error }))
    },
    [items, spaceId, isInvited, submit, dispatch],
  )
}
