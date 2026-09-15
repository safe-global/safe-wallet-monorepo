import { useCallback } from 'react'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sanitizeName } from '@safe-global/utils/validation/names'
import useChains from '@/hooks/useChains'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getContactUpdatedMessage } from '@/utils/addressBookNotifications'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useWorkspaceAddressBookLabel } from './useWorkspaceAddressBookLabel'

type UpsertWorkspaceSafeName = (args: { address: string; name: string }) => Promise<{ error?: string }>

export const useUpsertWorkspaceSafeName = (): UpsertWorkspaceSafeName => {
  const spaceId = useCurrentSpaceId()
  const { configs: chains } = useChains()
  const workspaceLabel = useWorkspaceAddressBookLabel()
  const dispatch = useAppDispatch()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  return useCallback(
    async ({ address, name }) => {
      if (!spaceId) return { error: 'No workspace is selected. Switch to a workspace and try again.' }
      if (chains.length === 0) return { error: 'Supported networks are still loading. Try again in a moment.' }

      const chainIds = chains.map((chain) => chain.chainId)
      const result = await upsertAddressBook({
        spaceId,
        upsertAddressBookItemsDto: { items: [{ name: sanitizeName(name), address, chainIds }] },
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
    [spaceId, chains, workspaceLabel, dispatch, upsertAddressBook],
  )
}
