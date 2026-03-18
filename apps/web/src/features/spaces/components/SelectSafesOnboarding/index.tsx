import type { ReactElement } from 'react'
import { FormProvider } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, Search, Loader2 } from 'lucide-react'
import css from './styles.module.css'
import StepIndicator from './components/StepIndicator'
import OnboardingSafesList from './components/OnboardingSafesList'
import useOnboardingNavigation from './hooks/useOnboardingNavigation'
import useOnboardingSafes from './hooks/useOnboardingSafes'
import useOnboardingSubmit from './hooks/useOnboardingSubmit'

const ONBOARDING_STEP = 2
const TOTAL_STEPS = 3

const SelectSafesOnboarding = (): ReactElement => {
  const { spaceId, isReady, handleBack, handleSkip, redirectToNextStep } = useOnboardingNavigation()
  const { trustedSafes, ownedSafes, similarAddresses, handleSearch } = useOnboardingSafes()
  const { formMethods, onSubmit, selectedSafesLength, error, isSubmitting } = useOnboardingSubmit(
    spaceId,
    redirectToNextStep,
  )

  if (!isReady) {
    return <></>
  }

  return (
    <div className={css.container}>
      <FormProvider {...formMethods}>
        <form onSubmit={onSubmit} className={css.form}>
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
              Consolidate and organize safes, members and transaction activity.
            </Typography>

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
          </div>

          <div className={css.safesListRegion} data-testid="onboarding-safes-list-scroll-region">
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
        </form>
      </FormProvider>
    </div>
  )
}

export default SelectSafesOnboarding
