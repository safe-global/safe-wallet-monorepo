import { useMemo, type ReactElement } from 'react'
import { FormProvider } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, Search, Loader2 } from 'lucide-react'
import useWallet from '@/hooks/wallets/useWallet'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import OnboardingLayout from '../OnboardingLayout'
import OnboardingIllustration from '../OnboardingLayout/Illustration'
import OnboardingSafesList from './components/OnboardingSafesList'
import ConnectWalletPrompt from './components/ConnectWalletPrompt'
import useOnboardingNavigation from './hooks/useOnboardingNavigation'
import useOnboardingSafes from './hooks/useOnboardingSafes'
import useOnboardingSubmit from './hooks/useOnboardingSubmit'
import { useSelectAll } from '@/features/spaces/hooks/useSelectAll'
import { SAFE_ACCOUNTS_LIMIT } from '@/features/spaces/components/Sidebar/constants'

const ONBOARDING_STEP = 2
const TOTAL_STEPS = 3

const SelectSafesOnboarding = (): ReactElement => {
  const wallet = useWallet()
  const { spaceId, handleBack, handleSkip, redirectToNextStep } = useOnboardingNavigation()
  const { data: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !spaceId })
  const { trustedSafes, ownedSafes, similarAddresses, handleSearch } = useOnboardingSafes()
  const allSafes = useMemo(() => [...trustedSafes, ...ownedSafes], [trustedSafes, ownedSafes])
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

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={onSubmit}>
        <OnboardingLayout
          step={{ current: ONBOARDING_STEP, total: TOTAL_STEPS }}
          title="Add Safes"
          description="Add existing Safes to your Space, or skip to add them later."
          illustration={<OnboardingIllustration variant="add-safes" spaceName={space?.name} />}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleBack}
                className="rounded-full px-5"
                disabled={isSubmitting}
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
              {wallet ? (
                <>
                  <Button
                    data-testid="select-safes-skip-button"
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="ml-auto rounded-full px-5"
                  >
                    Skip
                  </Button>
                  <Button
                    data-testid="select-safes-continue-button"
                    type="submit"
                    size="lg"
                    disabled={selectedSafesLength === 0 || isSubmitting}
                    className="rounded-full px-6"
                  >
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Next'}
                  </Button>
                </>
              ) : (
                <Button
                  data-testid="select-safes-skip-button"
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleSkip}
                  className="ml-auto rounded-full px-5"
                >
                  Skip
                </Button>
              )}
            </>
          }
        >
          {wallet ? (
            <>
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

              <div
                className="relative min-h-0 w-full flex-1 overflow-y-auto pr-1 after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:z-10 after:h-12 after:bg-gradient-to-t after:from-card after:to-transparent"
                data-testid="onboarding-safes-list-scroll-region"
              >
                {isAtLimit && (
                  <Typography variant="paragraph" color="muted" className="pb-1 text-xs">
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
          ) : (
            <div className="flex flex-col items-stretch justify-center gap-4 pt-4">
              <ConnectWalletPrompt testId="select-safes-connect-wallet-button" />
            </div>
          )}
        </OnboardingLayout>
      </form>
    </FormProvider>
  )
}

export default SelectSafesOnboarding
