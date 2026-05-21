import type { ReactElement } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { ChevronLeft } from 'lucide-react'
import OnboardingLayout from '../OnboardingLayout'
import { useIsCheckingAccess } from '@/hooks/useRouterGuard'
import { AppRoutes } from '@/config/routes'
import useExistingSpace from './hooks/useExistingSpace'
import useSpaceSubmit from './hooks/useSpaceSubmit'

const ONBOARDING_TOTAL_STEPS = 3

const CreateSpaceOnboarding = (): ReactElement => {
  const router = useRouter()
  const isCheckingAccess = useIsCheckingAccess() ?? true

  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
    setValue,
  } = useForm<{ name: string }>({ mode: 'onChange' })

  const { spaceId, isEditMode, isSpaceLoading } = useExistingSpace(setValue)
  const { error, isSubmitting, onSubmit } = useSpaceSubmit(handleSubmit, spaceId, isEditMode)

  const goBack = () => router.push(AppRoutes.welcome.spaces)

  return (
    <form onSubmit={onSubmit}>
      <OnboardingLayout
        step={{ current: 1, total: ONBOARDING_TOTAL_STEPS }}
        title="Create a Space"
        description="Your team's home for managing Safes, tracking activity, and collaborating."
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={goBack}
              className="rounded-full px-5"
              disabled={isSubmitting}
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>
            <Button
              data-testid="create-space-onboarding-continue-button"
              type="submit"
              size="lg"
              disabled={!isValid || isSubmitting || isCheckingAccess || isSpaceLoading}
              className="ml-auto rounded-full px-6"
            >
              {isSubmitting ? <Spinner /> : 'Next'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="space-name" className="text-sm font-semibold text-foreground">
            Space name
          </label>
          <div className="relative">
            <Input
              id="space-name"
              data-testid="space-name-input"
              placeholder="e.g. Treasury Ops, DeFi Team"
              autoComplete="off"
              autoFocus={!isEditMode}
              disabled={isCheckingAccess || isSpaceLoading}
              className="h-11 rounded-md bg-card px-4"
              {...register('name', {
                required: true,
                maxLength: { value: 30, message: 'Space name must be 30 characters or less' },
                pattern: {
                  value: /^[a-zA-Z0-9 ]+$/,
                  message: 'Space name must not contain special characters',
                },
                validate: (value) => value?.trim() !== '',
              })}
              error={errors.name?.message}
              onBlur={(e) => {
                setValue('name', e.target.value.trim(), { shouldValidate: true })
              }}
            />
            {isSpaceLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner className="size-4" />
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </OnboardingLayout>
    </form>
  )
}

export default CreateSpaceOnboarding
