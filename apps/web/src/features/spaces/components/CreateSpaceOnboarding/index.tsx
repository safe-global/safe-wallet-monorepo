import { useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { useSpacesCreateWithUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'motion/react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import StepIndicator from '@/features/spaces/components/StepIndicator'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated, setLastUsedSpace } from '@/store/authSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsCheckingAccess } from '@/hooks/useRouterGuard'

const ONBOARDING_TOTAL_STEPS = 4

const CreateSpaceOnboarding = (): ReactElement => {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const isCheckingAccess = useIsCheckingAccess() ?? true
  const [createSpaceWithUser] = useSpacesCreateWithUserV1Mutation()

  const {
    register,
    handleSubmit,
    formState: { isValid },
    setValue,
  } = useForm<{ name: string }>({ mode: 'onChange' })

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    try {
      setIsSubmitting(true)
      trackEvent({ ...SPACE_EVENTS.CREATE_SPACE })
      const response = await createSpaceWithUser({ createSpaceDto: { name: data.name } })

      if (response.data) {
        const spaceId = response.data.id.toString()

        dispatch(setLastUsedSpace(spaceId))

        dispatch(
          showNotification({
            message: `Created space with name ${data.name}.`,
            variant: 'success',
            groupKey: 'create-space-success',
          }),
        )

        router.push({ pathname: AppRoutes.welcome.selectSafes, query: { spaceId } })
      }

      if (response.error) {
        throw response.error
      }
    } catch (error) {
      // @ts-ignore
      const errorMessage = error?.data?.message || 'Failed creating the space. Please try again.'
      setError(errorMessage)
      setIsSubmitting(false)
    }
  })

  if (!wallet || !isUserAuthenticated) {
    return <></>
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeInOut' }}
      className="shadcn-scope"
    >
      <div className="flex min-h-screen items-center justify-center bg-secondary p-3">
        <div className="flex w-[350px] flex-col items-center gap-6">
          <StepIndicator totalSteps={ONBOARDING_TOTAL_STEPS} currentStep={1} />

          <h2 className="w-full text-center text-[30px] font-semibold leading-[30px] tracking-[-1px] text-foreground">
            Create a space
          </h2>

          <p className="w-full text-center text-base leading-6 text-muted-foreground">
            Consolidate and organize safes, members and transaction activity.
          </p>

          <form onSubmit={onSubmit} className="flex w-full flex-col gap-6">
            <Input
              data-testid="space-name-input"
              placeholder="Name your space"
              autoFocus
              disabled={isCheckingAccess}
              className="h-11 rounded-lg bg-card px-4"
              {...register('name', {
                required: true,
                maxLength: 50,
                validate: (value) => value?.trim() !== '',
              })}
              onBlur={(e) => {
                setValue('name', e.target.value.trim(), { shouldValidate: true })
              }}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              data-testid="create-space-button"
              type="submit"
              disabled={!isValid || isSubmitting || isCheckingAccess}
              className="h-10 w-full rounded-lg"
              size="lg"
            >
              {isSubmitting ? <Spinner /> : 'Continue'}
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}

export default CreateSpaceOnboarding
