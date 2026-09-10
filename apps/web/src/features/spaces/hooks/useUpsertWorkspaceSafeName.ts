import { useCallback } from 'react'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getContactUpdatedMessage } from '@/utils/addressBookNotifications'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import useGetSpaceAddressBook from './useGetSpaceAddressBook'
import { useWorkspaceAddressBookLabel } from './useWorkspaceAddressBookLabel'

type UpsertWorkspaceSafeName = (args: {
  address: string
  name: string
  chainIds: string[]
}) => Promise<{ error?: string }>

export const useUpsertWorkspaceSafeName = (): UpsertWorkspaceSafeName => {
  const spaceId = useCurrentSpaceId()
  const spaceAddressBook = useGetSpaceAddressBook()
  const workspaceLabel = useWorkspaceAddressBookLabel()
  const dispatch = useAppDispatch()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  return useCallback(
    async ({ address, name, chainIds }) => {
      if (!spaceId) return { error: 'No workspace is selected. Switch to a workspace and try again.' }

      // The upsert overwrites `chainIds` wholesale, so an entry that already spans more networks
      // than the Safe being renamed would silently lose them. Merge instead of replace.
      const existing = spaceAddressBook.find((item) => sameAddress(item.address, address))
      const mergedChainIds = Array.from(new Set([...(existing?.chainIds ?? []), ...chainIds]))

      const result = await upsertAddressBook({
        spaceId,
        upsertAddressBookItemsDto: { items: [{ name: sanitizeName(name), address, chainIds: mergedChainIds }] },
      })

      if (result.error) {
        return { error: getRtkQueryErrorMessage(result.error) }
      }

      dispatch(
        showNotification({
          message: getContactUpdatedMessage(workspaceLabel),
          variant: 'success',
          groupKey: 'workspace-safe-rename-success',
        }),
      )

      return {}
    },
    [spaceId, spaceAddressBook, workspaceLabel, dispatch, upsertAddressBook],
  )
}
