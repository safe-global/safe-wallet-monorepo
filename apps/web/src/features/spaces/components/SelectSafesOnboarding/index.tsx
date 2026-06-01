import { useMemo, type ReactElement } from 'react'
import { FormProvider, useWatch } from 'react-hook-form'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react'
import {
  OnboardingLayout,
  StepCounter,
  SafeAppMockup,
  deriveSidePanelAccountsFromSpace,
} from '@/features/spaces/components/OnboardingLayout'
import useWallet from '@/hooks/wallets/useWallet'
import { type AllSafeItems } from '@/hooks/safes'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import OnboardingSafesList from './components/OnboardingSafesList'
import ConnectWalletPrompt from './components/ConnectWalletPrompt'
import useOnboardingNavigation from './hooks/useOnboardingNavigation'
import useOnboardingSafes from './hooks/useOnboardingSafes'
import useOnboardingSubmit from './hooks/useOnboardingSubmit'
import { useSelectAll } from '@/features/spaces/hooks/useSelectAll'
import { SAFE_ACCOUNTS_LIMIT } from '@/features/spaces/components/Sidebar/constants'
import {
  deriveSidePanelAccounts,
  deriveSelectedBalanceSafes,
  deriveNameByAddress,
} from './utils/deriveSelectedAccounts'

const ONBOARDING_STEP = 2
const TOTAL_STEPS = 4
const FORM_ID = 'select-safes-form'

const SelectSafesOnboarding = (): ReactElement => {
  const wallet = useWallet()
  const { spaceId, handleBack, handleSkip, redirectToNextStep } = useOnboardingNavigation()
  const { trustedSafes, ownedSafes, similarAddresses, handleSearch, hasNoSafes } = useOnboardingSafes()
  const allSafes = useMemo<AllSafeItems>(() => [...trustedSafes, ...ownedSafes], [trustedSafes, ownedSafes])
  const { formMethods, onSubmit, selectedSafesLength, error, isSubmitting } = useOnboardingSubmit(
    spaceId,
    redirectToNextStep,
    allSafes,
  )

  const { control, setValue } = formMethods
  const { trustedSelection, ownedSelection, handleSelectAll, isAtLimit } = useSelectAll({
    visibleTrusted: trustedSafes,
    visibleOwned: ownedSafes,
    control,
    setValue,
  })

  const { data: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !spaceId })
  const { allSafes: spaceSafes } = useSpaceSafes()

  const selectedSafes = useWatch({ control, name: 'selectedSafes' })

  const nameByAddress = useMemo(() => deriveNameByAddress(allSafes), [allSafes])

  // Form starts empty; fall back to persisted Space safes so the mockup isn't blank on back-nav.
  const sidePanelAccounts = useMemo(() => {
    const isFormInitialized = Object.keys(selectedSafes ?? {}).length > 0
    if (isFormInitialized) {
      return deriveSidePanelAccounts(selectedSafes ?? {}, allSafes)
    }
    return deriveSidePanelAccountsFromSpace(spaceSafes).map((a) => ({
      ...a,
      name: a.name?.trim() || nameByAddress.get(a.address.toLowerCase()),
    }))
  }, [selectedSafes, allSafes, spaceSafes, nameByAddress])

  const balanceSafes = useMemo(
    () => deriveSelectedBalanceSafes(selectedSafes ?? {}, allSafes, spaceSafes),
    [selectedSafes, allSafes, spaceSafes],
  )

  const main = (
    <FormProvider {...formMethods}>
      <form id={FORM_ID} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-6 h-full">
        <StepCounter currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />

        <div className="flex flex-col gap-2 shrink-0">
          <Typography variant="h2">Select Safes</Typography>
          <Typography variant="paragraph" color="muted">
            Choose which Safes to add to this Workspace. You can add more later.
          </Typography>
        </div>

        {wallet ? (
          hasNoSafes ? (
            <Alert className="shrink-0">
              <AlertDescription>You don&apos;t have any safes yet</AlertDescription>
            </Alert>
          ) : (
            <>
              <InputGroup className="bg-card px-2 shrink-0">
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

              <div
                className="relative min-h-0 min-w-0 flex-1 overflow-hidden after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:z-10 after:h-16 after:bg-gradient-to-t after:from-muted after:to-transparent"
                data-testid="onboarding-safes-list-scroll-region"
              >
                {isAtLimit && (
                  <Typography variant="paragraph" color="muted" className="text-xs pb-1">
                    Limit of {SAFE_ACCOUNTS_LIMIT} accounts reached
                  </Typography>
                )}
                <OnboardingSafesList
                  trustedSafes={trustedSafes}
                  ownedSafes={ownedSafes}
                  similarAddresses={similarAddresses}
                  trustedSelectAll={{
                    state: trustedSelection.state,
                    count: trustedSelection.selectedCount,
                    total: trustedSelection.total,
                    onToggle: (check) => handleSelectAll('trusted', check),
                  }}
                  ownedSelectAll={{
                    state: ownedSelection.state,
                    count: ownedSelection.selectedCount,
                    total: ownedSelection.total,
                    onToggle: (check) => handleSelectAll('owned', check),
                  }}
                />
              </div>

              {error && (
                <Alert variant="destructive" className="shrink-0">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <ConnectWalletPrompt testId="select-safes-connect-wallet-button" />
            <Button
              data-testid="select-safes-skip-button"
              type="button"
              variant="secondary"
              onClick={handleSkip}
              className="w-full max-w-[300px] h-12 rounded-lg hover:bg-card"
            >
              Skip
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  )

  const footer = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col-reverse gap-3 xl:flex-row xl:items-center">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          disabled={isSubmitting}
          className="w-full h-12 rounded-lg bg-muted hover:bg-border xl:flex-1"
        >
          <ChevronLeft className="size-4 mr-1" />
          Back
        </Button>
        {wallet && (
          <Button
            data-testid="select-safes-continue-button"
            type="submit"
            form={FORM_ID}
            disabled={selectedSafesLength === 0 || isSubmitting}
            className="w-full h-12 rounded-lg text-base xl:flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Next
                <ChevronRight className="size-4 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>
      {wallet && (
        <button
          data-testid="select-safes-skip-link"
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          Skip, add Safes later
        </button>
      )}
    </div>
  )

  return (
    <OnboardingLayout
      main={main}
      footer={footer}
      sidePanel={
        <SafeAppMockup
          name={space?.name ?? ''}
          highlight="accounts"
          accounts={sidePanelAccounts}
          balanceSafes={balanceSafes}
        />
      }
    />
  )
}

export default SelectSafesOnboarding
