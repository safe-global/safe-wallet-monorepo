import { useState } from 'react'
import { useRouter } from 'next/router'
import {
  useSpacesCreateWithUserV1Mutation,
  useSpacesUpdateV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import { setLastUsedSpace } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { AppRoutes } from '@/config/routes'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
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
  const [createSpaceWithUser] = useSpacesCreateWithUserV1Mutation()
  const [updateSpace] = useSpacesUpdateV1Mutation()

  const editSpace = async (name: string) => {
    const response = await updateSpace({ id: Number(spaceId), updateSpaceDto: { name } })

    if (response.error) {
      throw new Error(getRtkQueryErrorMessage(response.error))
    }

    dispatch(
      showNotification({
        message: `Updated space name to ${name}.`,
        variant: 'success',
        groupKey: 'update-space-success',
      }),
    )

    router.push({ pathname: AppRoutes.welcome.selectSafes, query: { spaceId } })
  }

  const createSpace = async (name: string) => {
    trackEvent({ ...SPACE_EVENTS.CREATE_SPACE })
    const response = await createSpaceWithUser({ createSpaceDto: { name } })

    if (response.data) {
      const newSpaceId = response.data.id.toString()

      dispatch(setLastUsedSpace(newSpaceId))

      dispatch(
        showNotification({
          message: `Created space with name ${name}.`,
          variant: 'success',
          groupKey: 'create-space-success',
        }),
      )

      router.push({ pathname: AppRoutes.welcome.selectSafes, query: { spaceId: newSpaceId } })
    }

    if (response.error) {
      throw new Error(getRtkQueryErrorMessage(response.error))
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    try {
      setIsSubmitting(true)

      if (isEditMode && spaceId) {
        await editSpace(data.name)
      } else {
        await createSpace(data.name)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed ${isEditMode ? 'updating' : 'creating'} the space. Please try again.`
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
