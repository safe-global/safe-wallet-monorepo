import { useCallback, useState } from 'react'
import { useSpacesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import { setLastUsedSpace } from '@/store/authSlice'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { WorkspaceCreateEntryPoint } from '@/services/analytics/mixpanel-events'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { randomWorkspaceName } from '../utils/randomWorkspaceName'

/**
 * Offers and checkout are scoped to a Workspace, so a brand-new user gets one created under a placeholder name
 * before the trial modal opens; the onboarding wizard renames it after Stripe.
 */
export const useCreateTrialWorkspace = () => {
  const dispatch = useAppDispatch()
  const [createSpace, { isLoading: isCreating }] = useSpacesCreateV1Mutation()
  const [spaceId, setSpaceId] = useState<string>()
  const [error, setError] = useState<string>()

  const createTrialWorkspace = useCallback(async () => {
    setError(undefined)
    trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, { entry_point: WorkspaceCreateEntryPoint.WELCOME })

    const response = await createSpace({ createSpaceDto: { name: randomWorkspaceName() } })
    if (!response.data) {
      setError(response.error ? getRtkQueryErrorMessage(response.error) : 'Failed creating the workspace.')
      return
    }

    const newSpaceId = response.data.uuid
    trackEvent({ ...SPACE_EVENTS.WORKSPACE_CREATED, label: newSpaceId }, { workspace_id: newSpaceId })
    dispatch(setLastUsedSpace(newSpaceId))
    setSpaceId(newSpaceId)
  }, [createSpace, dispatch])

  const reset = useCallback(() => setSpaceId(undefined), [])

  return { createTrialWorkspace, spaceId, isCreating, error, reset }
}
