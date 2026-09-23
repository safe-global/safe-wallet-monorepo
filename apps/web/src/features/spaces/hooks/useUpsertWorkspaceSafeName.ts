import { useCallback } from 'react'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getContactUpdatedMessage } from '@/utils/addressBookNotifications'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useSpaceAddressBookState } from './useGetSpaceAddressBook'
import { useWorkspaceAddressBookLabel } from './useWorkspaceAddressBookLabel'

export type WorkspaceSafeName = { address: string; name: string; chainIds: string[] }

type UpsertResult = Promise<{ error?: string }>

export const ADDRESS_BOOK_UNAVAILABLE = 'The Workspace address book is unavailable. Try again in a moment.'

/** Writes several Safe names to the workspace address book in one request, without a notification. */
export const useUpsertWorkspaceSafeNames = (): ((items: WorkspaceSafeName[]) => UpsertResult) => {
  const spaceId = useCurrentSpaceId()
  const { items: spaceAddressBook, isLoading, isError } = useSpaceAddressBookState()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  return useCallback(
    async (items) => {
      if (items.length === 0) return {}
      if (!spaceId) return { error: 'No Workspace is selected. Switch to a Workspace and try again.' }
      if (isLoading || isError) return { error: ADDRESS_BOOK_UNAVAILABLE }

      // The upsert overwrites `chainIds` wholesale, so an entry that already spans more networks
      // than the Safe being renamed would silently lose them. Merge instead of replace.
      const mergedItems = items.map(({ address, name, chainIds }) => {
        const existing = spaceAddressBook.find((item) => sameAddress(item.address, address))
        return {
          name: sanitizeName(name),
          address,
          chainIds: Array.from(new Set([...(existing?.chainIds ?? []), ...chainIds])),
        }
      })

      const result = await upsertAddressBook({ spaceId, upsertAddressBookItemsDto: { items: mergedItems } })

      return result.error ? { error: getRtkQueryErrorMessage(result.error) } : {}
    },
    [spaceId, spaceAddressBook, isLoading, isError, upsertAddressBook],
  )
}

/** Writes one Safe name to the workspace address book and notifies on success. */
export const useUpsertWorkspaceSafeName = (): ((item: WorkspaceSafeName) => UpsertResult) => {
  const upsertNames = useUpsertWorkspaceSafeNames()
  const workspaceLabel = useWorkspaceAddressBookLabel()
  const dispatch = useAppDispatch()

  return useCallback(
    async (item) => {
      const result = await upsertNames([item])
      if (result.error) return result

      dispatch(
        showNotification({
          message: getContactUpdatedMessage(workspaceLabel),
          variant: 'success',
          groupKey: 'workspace-safe-rename-success',
        }),
      )

      return {}
    },
    [upsertNames, workspaceLabel, dispatch],
  )
}
