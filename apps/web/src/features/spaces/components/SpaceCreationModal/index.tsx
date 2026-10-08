import { useSpacesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useRouter } from 'next/router'
import { type ReactElement, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import NameInput from '@/components/common/NameInput'
import { NAME_MIN_LENGTH, SPACE_NAME_MAX_LENGTH, sanitizeName } from '@safe-global/utils/validation/names'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { useDarkMode } from '@/hooks/useDarkMode'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { SpaceCreationModalView } from '@views/features/spaces/components/SpaceCreationModal/SpaceCreationModalView'

function SpaceCreationModal({ onClose }: { onClose: () => void }): ReactElement {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const isDarkMode = useDarkMode()
  const methods = useForm<{ name: string }>({ mode: 'onChange' })
  const [createSpaceWithUser] = useSpacesCreateV1Mutation()
  const { handleSubmit, formState } = methods

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)
    const name = sanitizeName(data.name)

    try {
      setIsSubmitting(true)
      const response = await createSpaceWithUser({ createSpaceDto: { name } })

      if (response.data) {
        const spaceId = response.data.uuid
        trackEvent({ ...SPACE_EVENTS.WORKSPACE_CREATED, label: spaceId }, { workspace_id: spaceId })
        router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
        onClose()

        dispatch(
          showNotification({
            message: `Created Workspace with name ${name}.`,
            variant: 'success',
            groupKey: 'create-space-success',
          }),
        )
      }

      if (response.error) {
        throw response.error
      }
    } catch (error) {
      setError(getRtkQueryErrorMessage(error as FetchBaseQueryError | SerializedError))
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <FormProvider {...methods}>
      <SpaceCreationModalView
        isDarkMode={isDarkMode}
        error={error}
        isValid={formState.isValid}
        isSubmitting={isSubmitting}
        onClose={onClose}
        onSubmit={onSubmit}
        renderNameInput={(label) => (
          <NameInput
            data-testid="space-name-input"
            label={label}
            autoFocus
            name="name"
            required
            validateCharset
            minLength={NAME_MIN_LENGTH}
            maxLength={SPACE_NAME_MAX_LENGTH}
          />
        )}
      />
    </FormProvider>
  )
}

export default SpaceCreationModal
