import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'
import { useSpacesCreateV1Mutation, useSpacesUpdateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import { setLastUsedSpace } from '@/store/authSlice'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { AppRoutes } from '@/config/routes'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { sanitizeNextUrl } from '@/utils/nextUrl'
import { sanitizeName } from '@safe-global/utils/validation/names'
import type { UseFormHandleSubmit } from 'react-hook-form'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'

const useSpaceSubmit = (
  handleSubmit: UseFormHandleSubmit<{ name: string }>,
  spaceId: string | undefined,
  isEditMode: boolean,
) => {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Under Safe Pro a freshly created Workspace is offered its trial before the wizard moves on.
  const [createdSpaceId, setCreatedSpaceId] = useState<string>()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const safe = useSafeQueryParam() || undefined
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const [createSpaceWithUser] = useSpacesCreateV1Mutation()
  const [updateSpace] = useSpacesUpdateV1Mutation()

  const goToSelectSafes = useCallback(
    (targetSpaceId: string) => {
      const next = sanitizeNextUrl(router.query.next)
      router.push({
        pathname: AppRoutes.welcome.selectSafes,
        query: { spaceId: targetSpaceId, ...(safe ? { safe } : {}), ...(next ? { next } : {}) },
      })
    },
    [router, safe],
  )

  const editSpace = async (name: string) => {
    const response = await updateSpace({ id: spaceId ?? '', updateSpaceDto: { name: sanitizeName(name) } })

    if (isElevationRequiredError(response.error)) throw response.error
    if (response.error) {
      throw new Error(getRtkQueryErrorMessage(response.error))
    }

    goToSelectSafes(spaceId ?? '')
  }

  const createSpace = async (name: string) => {
    const response = await createSpaceWithUser({ createSpaceDto: { name: sanitizeName(name) } })

    if (response.data) {
      const newSpaceId = response.data.uuid
      trackEvent({ ...SPACE_EVENTS.WORKSPACE_CREATED, label: newSpaceId }, { workspace_id: newSpaceId })

      dispatch(setLastUsedSpace(newSpaceId))

      if (isSafePro) {
        setCreatedSpaceId(newSpaceId)
        setIsSubmitting(false)
        return
      }
      goToSelectSafes(newSpaceId)
    }

    if (response.error) {
      throw new Error(getRtkQueryErrorMessage(response.error))
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    // The Workspace exists and waits on its trial offer; submitting again would create a second one.
    if (createdSpaceId) return
    setError(undefined)

    try {
      setIsSubmitting(true)

      if (isEditMode && spaceId) {
        await editSpace(data.name)
      } else {
        await createSpace(data.name)
      }
    } catch (error) {
      setIsSubmitting(false)
      if (isElevationRequiredError(error)) return
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed ${isEditMode ? 'updating' : 'creating'} the Workspace. Please try again.`
      setError(errorMessage)
    }
  })

  return {
    error,
    isSubmitting,
    onSubmit,
    createdSpaceId,
    goToSelectSafes,
  }
}

export default useSpaceSubmit
