import type { ReactElement } from 'react'
import { FormProvider } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, Search, Loader2 } from 'lucide-react'
import StepIndicator from './components/StepIndicator'
import OnboardingSafesList from './components/OnboardingSafesList'
import useOnboardingNavigation from './hooks/useOnboardingNavigation'
import useOnboardingSafes from './hooks/useOnboardingSafes'
import useOnboardingSubmit from './hooks/useOnboardingSubmit'

const ONBOARDING_STEP = 2
const TOTAL_STEPS = 4

const SelectSafesOnboarding = (): ReactElement => {
  const { spaceId, isReady, handleBack, handleSkip, redirectToNextStep } = useOnboardingNavigation()
  const { displayedSafes, handleSearch } = useOnboardingSafes()
  const { formMethods, onSubmit, selectedSafesLength, error, isSubmitting } = useOnboardingSubmit(
    spaceId,
    redirectToNextStep,
  )

  if (!isReady) {
    return <></>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <FormProvider {...formMethods}>
        <form onSubmit={onSubmit} className="flex w-full max-w-[520px] flex-col gap-8">
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

          <h2 className="w-full text-center text-[30px] font-semibold leading-[30px] tracking-[-1px] text-foreground">
            Select Safes for your Space
          </h2>

          <p className="text-center text-base leading-6 text-muted-foreground w-[93%] mx-auto">
            Consolidate and organize safes, members and transaction activity.
          </p>

          <InputGroup className="bg-card px-2">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search for safes"
              aria-label="Search Safe list"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </InputGroup>

          <OnboardingSafesList safes={displayedSafes} />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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
            className="w-full"
          >
            Skip
          </Button>
        </form>
      </FormProvider>
    </div>
  )
}

export default SelectSafesOnboarding
