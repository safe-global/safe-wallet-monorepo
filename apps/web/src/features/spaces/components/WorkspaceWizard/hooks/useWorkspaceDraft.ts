import { useCallback, useMemo } from 'react'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import {
  selectStoredWorkspaceDraft,
  updateWorkspaceDraft,
  usableDraft,
  type WorkspaceDraftFields,
} from '@/features/spaces/store'

/** The signed-in user's onboarding draft; `isReady` is false until we know who the user is. */
export const useWorkspaceDraft = () => {
  const dispatch = useAppDispatch()
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isSignedIn })
  const stored = useAppSelector(selectStoredWorkspaceDraft)
  const ownerId = user?.id

  const draft = useMemo(() => usableDraft(stored, ownerId, Date.now()), [stored, ownerId])
  const ownAddresses = useMemo(() => user?.wallets.map((wallet) => wallet.address) ?? [], [user])

  const update = useCallback(
    (changes: Partial<WorkspaceDraftFields>) => {
      // Steps only act once `isReady`; a write before that would belong to nobody.
      if (ownerId === undefined) throw new Error('The onboarding draft cannot be saved before the user is known')
      dispatch(updateWorkspaceDraft(ownerId, changes))
    },
    [dispatch, ownerId],
  )

  return { draft, update, ownAddresses, isReady: ownerId !== undefined }
}
