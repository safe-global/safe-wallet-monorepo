import type { ReactElement } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { motion } from 'motion/react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import StepIndicator from '@/features/spaces/components/StepIndicator'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsCheckingAccess } from '@/hooks/useRouterGuard'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import useExistingSpace from './hooks/useExistingSpace'
import useSpaceSubmit from './hooks/useSpaceSubmit'

const ONBOARDING_TOTAL_STEPS = 3

const CreateSpaceOnboarding = (): ReactElement => {
  const wallet = useWallet()
  const isDarkMode = useDarkMode()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const isCheckingAccess = useIsCheckingAccess() ?? true

  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
    setValue,
  } = useForm<{ name: string }>({ mode: 'onChange' })

  const { spaceId, isEditMode, isSpaceLoading } = useExistingSpace(setValue)
  const { error, isSubmitting, onSubmit } = useSpaceSubmit(handleSubmit, spaceId, isEditMode)

  if (!wallet || !isUserAuthenticated) {
    return <></>
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeInOut' }}
      className={cn('shadcn-scope', isDarkMode && 'dark')}
    >
      <div className="flex min-h-screen items-center justify-center bg-secondary p-3">
        <div className="flex w-[350px] flex-col items-center gap-6">
          <StepIndicator totalSteps={ONBOARDING_TOTAL_STEPS} currentStep={1} />

          <Typography variant="h2" align="center">
            Create a space
          </Typography>

          <Typography variant="paragraph" align="center" color="muted">
            Choose which safes you want to manage in this space. You can add more later.
          </Typography>

          <form onSubmit={onSubmit} className="flex w-full flex-col gap-6">
            <div className="relative">
              <Input
                data-testid="space-name-input"
                placeholder="Name your space"
                autoComplete="off"
                autoFocus={!isEditMode}
                disabled={isCheckingAccess || isSpaceLoading}
                className="h-11 rounded-lg bg-card px-4"
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

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              data-testid="create-space-button"
              type="submit"
              disabled={!isValid || isSubmitting || isCheckingAccess || isSpaceLoading}
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
