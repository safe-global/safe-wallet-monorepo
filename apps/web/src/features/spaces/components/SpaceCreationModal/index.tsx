import { useSpacesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useRouter } from 'next/router'
import { type ReactElement, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import SpaceIcon from '@/public/images/spaces/space.svg'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { setLastUsedSpace } from '@/store/authSlice'
import { useAppDispatch } from '@/store'
import ExternalLink from '@/components/common/ExternalLink'
import { Alert, AlertDescription } from '@/components/ui/alert'
import DialogActions from '@/components/common/DialogActions'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'

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

    try {
      setIsSubmitting(true)
      const response = await createSpaceWithUser({ createSpaceDto: { name: data.name } })

      if (response.data) {
        const spaceId = response.data.uuid
        trackEvent({ ...SPACE_EVENTS.WORKSPACE_CREATED, label: spaceId }, { workspace_id: spaceId })
        dispatch(setLastUsedSpace(spaceId))
        router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
        onClose()

        dispatch(
          showNotification({
            message: `Created workspace with name ${data.name}.`,
            variant: 'success',
            groupKey: 'create-space-success',
          }),
        )
      }

      if (response.error) {
        throw response.error
      }
    } catch (error) {
      // @ts-ignore
      const errorMessage = error?.data?.message || 'Failed creating the workspace. Please try again.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <ModalDialog
      open
      onClose={onClose}
      dialogTitle={
        <>
          <SpaceIcon className="mr-2 size-6 fill-none" />
          Create workspace
        </>
      }
      hideChainIndicator
    >
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <div className="px-6 py-4">
              <div className="mb-4">
                <NameInput data-testid="space-name-input" label="Name" autoFocus name="name" required />
              </div>
              <Typography variant="paragraph-small" color="muted">
                How is my data processed? Read our <ExternalLink href={AppRoutes.privacy}>privacy policy</ExternalLink>
              </Typography>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogActions
              className="p-4 pt-0"
              onCancel={onClose}
              cancelTestId="cancel-btn"
              confirmLabel="Create workspace"
              confirmType="submit"
              confirmDisabled={!formState.isValid || isSubmitting}
              confirmLoading={isSubmitting}
              confirmTestId="create-space-modal-button"
            />
          </form>
        </FormProvider>
      </div>
    </ModalDialog>
  )
}

export default SpaceCreationModal
