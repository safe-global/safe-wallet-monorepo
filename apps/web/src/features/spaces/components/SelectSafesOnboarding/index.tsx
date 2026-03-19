import type { ReactElement } from 'react'
import { FormProvider } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, Search, Loader2, Wallet } from 'lucide-react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import useWallet from '@/hooks/wallets/useWallet'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import StepIndicator from './components/StepIndicator'
import OnboardingSafesList from './components/OnboardingSafesList'
import useOnboardingNavigation from './hooks/useOnboardingNavigation'
import useOnboardingSafes from './hooks/useOnboardingSafes'
import useOnboardingSubmit from './hooks/useOnboardingSubmit'

const ONBOARDING_STEP = 2
const TOTAL_STEPS = 3

const SelectSafesOnboarding = (): ReactElement => {
  const isDarkMode = useDarkMode()
  const wallet = useWallet()
  const connectWallet = useConnectWallet()
  const { spaceId, handleBack, handleSkip, redirectToNextStep } = useOnboardingNavigation()
  const { trustedSafes, ownedSafes, similarAddresses, handleSearch } = useOnboardingSafes()
  const { formMethods, onSubmit, selectedSafesLength, error, isSubmitting } = useOnboardingSubmit(
    spaceId,
    redirectToNextStep,
  )

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="box-border flex h-dvh max-h-dvh w-full min-w-0 max-w-full flex-col overflow-hidden overflow-x-hidden bg-secondary p-4">
        <FormProvider {...formMethods}>
          <form
            onSubmit={onSubmit}
            className="mx-auto flex justify-center min-h-0 w-full min-w-0 max-w-full flex-1 flex-col gap-4 sm:max-w-[520px]"
          >
            <div className="flex shrink-0 flex-col gap-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-md border border-card shadow-sm"
              >
                <ChevronLeft className="size-5" />
              </Button>

              <div className="flex items-center justify-center py-xs">
                <StepIndicator currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />
              </div>

              <Typography variant="h2" align="center">
                Select Safes for your Space
              </Typography>

              <Typography variant="paragraph" align="center" color="muted" className="mx-auto w-[93%]">
                Choose which Safes you want to manage in this Space. You can add more later.
              </Typography>

              {wallet && (
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
              )}
            </div>

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

                <div className="flex shrink-0 flex-col gap-5 pt-2">
                  <Button
                    data-testid="select-safes-continue-button"
                    type="submit"
                    size="lg"
                    disabled={selectedSafesLength === 0 || isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Continue'}
                  </Button>

                  <Button
                    data-testid="select-safes-skip-button"
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="w-full hover:bg-card"
                  >
                    Skip
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col mt-8 items-center justify-center gap-4">
                <Wallet className="size-12 text-muted-foreground" />
                <Typography variant="paragraph" align="center" color="muted">
                  Connect your wallet to see your safes
                </Typography>
                <Button
                  data-testid="select-safes-connect-wallet-button"
                  type="button"
                  size="lg"
                  onClick={connectWallet}
                  className="w-full max-w-[300px]"
                >
                  Connect wallet
                </Button>
                <Button
                  data-testid="select-safes-skip-button"
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleSkip}
                  className="w-full max-w-[300px] hover:bg-card"
                >
                  Skip
                </Button>
              </div>
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  )
}

export default SelectSafesOnboarding
