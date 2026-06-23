import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSpacesCreateV1Mutation, useSpacesUpdateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import { setLastUsedSpace } from '@/store/authSlice'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { AppRoutes } from '@/config/routes'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import { sanitizeNextUrl } from '@/utils/nextUrl'
import type { UseFormHandleSubmit } from 'react-hook-form'

const useSpaceSubmit = (
  handleSubmit: UseFormHandleSubmit<{ name: string }>,
  spaceId: string | undefined,
  isEditMode: boolean,
) => {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const safe = useSafeQueryParam() || undefined
  const [createSpaceWithUser] = useSpacesCreateV1Mutation()
  const [updateSpace] = useSpacesUpdateV1Mutation()

  const editSpace = async (name: string) => {
    const response = await updateSpace({ id: spaceId ?? '', updateSpaceDto: { name } })

    if (response.error) {
      throw new Error(getRtkQueryErrorMessage(response.error))
    }

    const next = sanitizeNextUrl(router.query.next)
    router.push({
      pathname: AppRoutes.welcome.selectSafes,
      query: { spaceId, ...(safe ? { safe } : {}), ...(next ? { next } : {}) },
    })
  }

  const createSpace = async (name: string) => {
    const response = await createSpaceWithUser({ createSpaceDto: { name } })

    if (response.data) {
      const newSpaceId = response.data.uuid
      trackEvent({ ...SPACE_EVENTS.WORKSPACE_CREATED, label: newSpaceId }, { workspace_id: newSpaceId })

      dispatch(setLastUsedSpace(newSpaceId))

      const next = sanitizeNextUrl(router.query.next)
      router.push({
        pathname: AppRoutes.welcome.selectSafes,
        query: { spaceId: newSpaceId, ...(safe ? { safe } : {}), ...(next ? { next } : {}) },
      })
    }

    if (response.error) {
      throw new Error(getRtkQueryErrorMessage(response.error))
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    try {
      setIsSubmitting(true)

      const name = sanitizeName(data.name)

      if (isEditMode && spaceId) {
        await editSpace(name)
      } else {
        await createSpace(name)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed ${isEditMode ? 'updating' : 'creating'} the workspace. Please try again.`
      setError(errorMessage)
      setIsSubmitting(false)
    }
  })

  return {
    error,
    isSubmitting,
    onSubmit,
  }
}

export default useSpaceSubmit
