import type { ReactElement } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import SpacesIllustration from '@/public/images/spaces/spaces.svg'
import { SvgIcon } from '@mui/material'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { AppRoutes } from '@/config/routes'

const ONBOARDING_TOTAL_STEPS = 3

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
} as const

const iconVariants = {
  hidden: { opacity: 0, scale: 0.75 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, ease: [0.34, 1.4, 0.64, 1] as const },
  },
} as const

const CreateSpaceOnboarding = (): ReactElement => {
  const wallet = useWallet()
  const isDarkMode = useDarkMode()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const isCheckingAccess = useIsCheckingAccess() ?? true
  const router = useRouter()

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
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-secondary p-3">
        {/* Back button */}
        <motion.div
          className="absolute left-6 top-6"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(AppRoutes.welcome.spaces)}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
        </motion.div>

        {/* Animated background orbs */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
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
          {/* Animated icon */}
          <motion.div variants={iconVariants} className="relative mb-2">
            {/* Pulsing glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              style={{
                background: 'radial-gradient(circle, rgba(134,239,172,0.35) 0%, transparent 70%)',
              }}
            />
            {/* Floating icon */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <SvgIcon
                component={SpacesIllustration}
                inheritViewBox
                sx={{ fontSize: 96, display: 'block' }}
              />
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <StepIndicator totalSteps={ONBOARDING_TOTAL_STEPS} currentStep={1} />
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="w-full text-center text-[30px] font-semibold leading-[30px] tracking-[-1px] text-foreground"
          >
            Create a space
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="w-full text-center text-base leading-6 text-muted-foreground"
          >
            Consolidate and organize safes, members and transaction activity.
          </motion.p>

          <motion.form variants={itemVariants} onSubmit={onSubmit} className="flex w-full flex-col gap-6">
            <div className="relative">
              <Input
                data-testid="space-name-input"
                placeholder="Name your space"
                autoFocus={!isEditMode}
                disabled={isCheckingAccess || isSpaceLoading}
                className="h-11 rounded-lg bg-card px-4"
                {...register('name', {
                  required: true,
                  maxLength: { value: 50, message: 'Space name must be 50 characters or less' },
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
          </motion.form>
        </motion.div>
      </div>
    </div>
  )
}

export default CreateSpaceOnboarding
