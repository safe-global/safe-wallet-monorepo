import type { ReactElement } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { motion } from 'motion/react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { ChevronLeft } from 'lucide-react'
import StepIndicator from '@/features/spaces/components/StepIndicator'
import { useIsCheckingAccess } from '@/hooks/useRouterGuard'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import SafeLogo from '@/public/images/logo-no-text.svg'
import { AppRoutes } from '@/config/routes'
import useExistingSpace from './hooks/useExistingSpace'
import useSpaceSubmit from './hooks/useSpaceSubmit'
import { containerVariants, itemVariants, iconVariants } from './utils'

const ONBOARDING_TOTAL_STEPS = 3

const CreateSpaceOnboarding = (): ReactElement => {
  const router = useRouter()
  const isDarkMode = useDarkMode()
  const isCheckingAccess = useIsCheckingAccess() ?? true

  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
    setValue,
  } = useForm<{ name: string }>({ mode: 'onChange' })

  const { spaceId, isEditMode, isSpaceLoading } = useExistingSpace(setValue)
  const { error, isSubmitting, onSubmit } = useSpaceSubmit(handleSubmit, spaceId, isEditMode)

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-secondary p-3">
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, x: [0, 35, -20, 10, 0], y: [0, -30, 20, -10, 0] }}
            transition={{
              opacity: { duration: 1.4, ease: 'easeOut' },
              scale: { duration: 1.4, ease: 'easeOut' },
              x: { duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
              y: { duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
            }}
          >
            <div className="h-[560px] w-[560px] rounded-full bg-gradient-to-br from-green-200/40 via-green-100/20 to-transparent blur-3xl dark:from-green-900/25 dark:via-green-800/10 dark:to-transparent" />
          </motion.div>
        </div>

        <motion.div
          className="pointer-events-none absolute bottom-1/4 right-1/4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: [0, -30, 20, -10, 0], y: [0, 25, -15, 8, 0] }}
          transition={{
            opacity: { duration: 1.8, delay: 0.3, ease: 'easeOut' },
            x: { duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 2 },
            y: { duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 },
          }}
        >
          <div className="h-[280px] w-[280px] rounded-full bg-gradient-to-tr from-blue-100/25 via-transparent to-transparent blur-3xl dark:from-blue-900/15" />
        </motion.div>

        {/* Content */}
        <motion.div
          className="relative flex w-[350px] flex-col items-center gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push(AppRoutes.welcome.spaces)}
            className="self-start rounded-md border border-card shadow-sm"
          >
            <ChevronLeft className="size-5" />
          </Button>

          {/* Animated icon */}
          <motion.div variants={iconVariants} className="relative mb-2">
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              style={{
                background: 'radial-gradient(circle, rgba(134,239,172,0.35) 0%, transparent 70%)',
              }}
            />
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <SafeLogo alt="Safe logo" width={64} height={64} />
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <StepIndicator totalSteps={ONBOARDING_TOTAL_STEPS} currentStep={1} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Typography variant="h2" align="center">
              Create a Space
            </Typography>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Typography variant="paragraph" align="center" color="muted">
              Consolidate and organize Safes, members and transaction activity.
            </Typography>
          </motion.div>

          <motion.form variants={itemVariants} onSubmit={onSubmit} className="flex w-full flex-col gap-6">
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
              data-testid="create-space-onboarding-continue-button"
              type="submit"
              disabled={!isValid || isSubmitting || isCheckingAccess || isSpaceLoading}
              className="h-10 w-full rounded-lg"
              size="lg"
            >
              {isSubmitting ? <Spinner /> : 'Continue'}
            </Button>
          </motion.form>
        </motion.div>
      </div>
    </div>
  )
}

export default CreateSpaceOnboarding
