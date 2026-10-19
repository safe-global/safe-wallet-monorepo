import { useEffect, useState } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { useCurrentSpaceId, useIsAdmin } from '@/features/spaces'
import { useIsAllowlistAvailableInSpace } from '@/features/policy-guard'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { useSpacesGetOneV1Query, useSpacesUpdateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import ExperimentalSection, {
  type ExperimentalFeature,
} from '@safe-global/views/features/spaces/components/SpaceSettings/ExperimentalSection'

const ExperimentalPage = () => {
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space, isFetching } = useSpacesGetOneV1Query(
    { id: spaceId ?? '' },
    { skip: !isSignedIn || !spaceId },
  )
  const isAdmin = useIsAdmin()
  const isAllowlistAvailable = useIsAllowlistAvailableInSpace()
  const [updateSpace, { isLoading: isSaving }] = useSpacesUpdateV1Mutation()
  // Optimistic value held until the refetch after the PATCH lands
  const [pending, setPending] = useState<ExperimentalFeature[]>()

  const serverFeatures = space?.experimentalFeatures

  useEffect(() => {
    if (!isFetching && !isSaving) setPending(undefined)
  }, [serverFeatures, isFetching, isSaving])

  const available: ExperimentalFeature[] = isAllowlistAvailable ? ['POLICY_RECIPIENT_ALLOWLIST'] : []

  const handleChange = async (next: ExperimentalFeature[]) => {
    if (!space) return
    setPending(next)
    try {
      await updateSpace({ id: space.uuid, updateSpaceDto: { experimentalFeatures: next } }).unwrap()
    } catch (e) {
      setPending(undefined)
      if (isElevationRequiredError(e)) return
      console.error(e)
      dispatch(
        showNotification({
          variant: 'error',
          message: 'Failed to update experimental features',
          detailedMessage: getRtkQueryErrorMessage(e as FetchBaseQueryError | SerializedError),
          groupKey: 'space-update-experimental',
        }),
      )
    }
  }

  return (
    <div data-testid="settings-experimental-page">
      <ExperimentalSection
        available={available}
        enabled={pending ?? serverFeatures ?? []}
        onChange={handleChange}
        isAdmin={isAdmin}
        isSaving={isSaving || pending !== undefined || !space}
      />
    </div>
  )
}

export default ExperimentalPage
