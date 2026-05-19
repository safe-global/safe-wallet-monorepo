import { useMemo, type ReactElement } from 'react'
import { FormProvider } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, Search, Loader2, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import StepIndicator from '@/features/spaces/components/StepIndicator'
import OnboardingSafesList from './components/OnboardingSafesList'
import useOnboardingNavigation from './hooks/useOnboardingNavigation'
import useOnboardingSafes from './hooks/useOnboardingSafes'
import useOnboardingSubmit from './hooks/useOnboardingSubmit'
import { containerVariants, itemVariants } from '../CreateSpaceOnboarding/utils'

const ONBOARDING_STEP = 2
const TOTAL_STEPS = 4

const SelectSafesOnboarding = (): ReactElement => {
  const isDarkMode = useDarkMode()
  const wallet = useWallet()
  const connectWallet = useConnectWallet()
  const { spaceId, handleBack, handleSkip, redirectToNextStep } = useOnboardingNavigation()
  const { trustedSafes, ownedSafes, similarAddresses, handleSearch } = useOnboardingSafes()
  const allSafes = useMemo(() => [...trustedSafes, ...ownedSafes], [trustedSafes, ownedSafes])
  const { formMethods, onSubmit, selectedSafesLength, error, isSubmitting } = useOnboardingSubmit(
    spaceId,
    redirectToNextStep,
    allSafes,
  )

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="relative box-border flex h-dvh max-h-dvh w-full min-w-0 max-w-full flex-col overflow-hidden bg-secondary p-4">
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

        <FormProvider {...formMethods}>
          <form
            onSubmit={onSubmit}
            className="relative mx-auto flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col gap-6 sm:max-w-[520px]"
          >
            <motion.div
              className="flex shrink-0 flex-col items-center gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="self-start">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="rounded-xl border border-card shadow-sm"
                >
                  <ChevronLeft className="size-5" />
                </Button>
              </motion.div>

              <motion.div variants={itemVariants}>
                <StepIndicator currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />
              </motion.div>

              <motion.div variants={itemVariants}>
                <Typography variant="h2" align="center">
                  Select Safes for your Workspace
                </Typography>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Typography variant="paragraph" align="center" color="muted" className="max-w-[380px]">
                  Choose which Safes you want to manage in this Workspace. You can add more later.
                </Typography>
              </motion.div>

              {wallet && (
                <motion.div variants={itemVariants} className="w-full pt-2">
                  <InputGroup className="bg-card px-2">
                    <InputGroupAddon>
                      <Search className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Search for safes"
                      aria-label="Search Safe list"
                      autoComplete="off"
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </InputGroup>
                </motion.div>
              )}
            </motion.div>

            {wallet ? (
              <>
                <div
                  className="relative min-h-0 min-w-0 w-full flex-1 overflow-hidden overflow-x-hidden after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:z-10 after:h-16 after:bg-gradient-to-t after:from-secondary after:to-transparent"
                  data-testid="onboarding-safes-list-scroll-region"
                >
                  <OnboardingSafesList
                    trustedSafes={trustedSafes}
                    ownedSafes={ownedSafes}
                    similarAddresses={similarAddresses}
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="shrink-0">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex shrink-0 flex-col items-center gap-3">
                  <Button
                    data-testid="select-safes-continue-button"
                    type="submit"
                    size="lg"
                    disabled={selectedSafesLength === 0 || isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Continue'}
                  </Button>

                  <button
                    data-testid="select-safes-skip-button"
                    type="button"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="pb-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Skip for now
                  </button>
                </div>
              </>
            ) : (
              <motion.div
                className="flex flex-1 flex-col items-center justify-center gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-card shadow-sm">
                    <ShieldCheck className="size-6 text-muted-foreground" />
                  </div>
                  <Typography variant="paragraph" align="center" color="muted" className="max-w-[280px]">
                    Connect your wallet to discover your existing Safes
                  </Typography>
                </motion.div>

                <motion.div variants={itemVariants} className="flex w-full max-w-[350px] flex-col items-center gap-3">
                  <Button
                    data-testid="select-safes-connect-wallet-button"
                    type="button"
                    size="lg"
                    onClick={connectWallet}
                    className="w-full"
                  >
                    Connect wallet
                  </Button>

                  <button
                    data-testid="select-safes-skip-button"
                    type="button"
                    onClick={handleSkip}
                    className="pb-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Skip for now
                  </button>
                </motion.div>
              </motion.div>
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  )
}

export default SelectSafesOnboarding
