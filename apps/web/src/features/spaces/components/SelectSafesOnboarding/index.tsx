import { useMemo, type ReactElement } from 'react'
import { useWatch } from 'react-hook-form'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronLeft, ChevronRight, Search, Loader2, Info } from 'lucide-react'
import SimilarityConfirmDialog from '@/components/common/TrustedSafesModal/SimilarityConfirmDialog'
import { OnboardingLayout, StepCounter, SafeAppMockup, deriveSidePanelAccountsFromSpace } from '../OnboardingLayout'
import useWallet from '@/hooks/wallets/useWallet'
import { type AllSafeItems } from '@/hooks/safes'
import { cn } from '@/utils/cn'
import { SAFE_ACCOUNTS_LIMIT } from '../../constants'
import { useSpaceSafes } from '../../hooks/useSpaceSafes'
import { useOnboardingStepCount } from '../../hooks/useOnboardingStepCount'
import OnboardingSafesList from './components/OnboardingSafesList'
import ConnectWalletHint from '../ConnectWalletHint'
import useOnboardingNavigation from './hooks/useOnboardingNavigation'
import useOnboardingSafes from './hooks/useOnboardingSafes'
import useOnboardingSubmit from './hooks/useOnboardingSubmit'
import useOnboardingSelection from './hooks/useOnboardingSelection'
import {
  deriveSidePanelAccounts,
  deriveSelectedBalanceSafes,
  deriveNameByAddress,
} from './utils/deriveSelectedAccounts'

const ONBOARDING_STEP = 2
const FORM_ID = 'select-safes-form'

const SelectSafesOnboarding = (): ReactElement => {
  const wallet = useWallet()
  const totalSteps = useOnboardingStepCount()
  const { spaceId, handleBack, handleSkip, redirectToNextStep } = useOnboardingNavigation()
  const { trustedSafes, ownedSafes, flaggedOwnedAddresses, handleSearch, hasNoSafes } = useOnboardingSafes()
  const allSafes = useMemo<AllSafeItems>(() => [...trustedSafes, ...ownedSafes], [trustedSafes, ownedSafes])
  const { formMethods, onSubmit, selectedSafesLength, error, isSubmitting } = useOnboardingSubmit(
    spaceId,
    redirectToNextStep,
    allSafes,
  )

  const { control, setValue } = formMethods
  const { selectedKeys, isAtLimit, handleToggle, pendingConfirmation, confirmPending, cancelPending } =
    useOnboardingSelection({ items: allSafes, control, setValue, flaggedOwnedAddresses })

  const { data: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !spaceId })
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

  const noSearchResults = !hasNoSafes && trustedSafes.length === 0 && ownedSafes.length === 0

  const main = (
    <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-6">
      <StepCounter currentStep={ONBOARDING_STEP} totalSteps={totalSteps} />

      <div className="flex flex-col gap-2 shrink-0">
        <Typography variant="h2">Select Safe accounts</Typography>
        <Typography variant="paragraph" color="muted">
          Choose which Safe account to add to this Workspace. You can add more later.
        </Typography>
      </div>

      {!wallet && <ConnectWalletHint testId="select-safes-connect-wallet-button" />}

      {hasNoSafes ? (
        <Alert className="shrink-0">
          <AlertDescription>You don&apos;t have any safes yet</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex shrink-0 items-center gap-3">
            <div
              className={cn(
                'flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm',
                isAtLimit ? 'font-semibold text-yellow-700' : 'text-muted-foreground',
              )}
            >
              {selectedKeys.size} of {SAFE_ACCOUNTS_LIMIT} selected
              <Tooltip>
                <TooltipTrigger render={<span className="inline-flex cursor-help" />}>
                  <Info className="size-4" />
                </TooltipTrigger>
                <TooltipContent>You can add up to {SAFE_ACCOUNTS_LIMIT} Safe accounts per workspace</TooltipContent>
              </Tooltip>
            </div>
            <InputGroup className="flex-1 rounded-md bg-card">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="by name, address or network"
                aria-label="Search Safe list"
                autoComplete="off"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="relative min-w-0" data-testid="onboarding-safes-list-region">
            {noSearchResults ? (
              <Typography variant="paragraph" align="center" color="muted" className="py-8">
                No safes match your search
              </Typography>
            ) : (
              <OnboardingSafesList
                trustedSafes={trustedSafes}
                ownedSafes={ownedSafes}
                flaggedOwnedAddresses={flaggedOwnedAddresses}
                selectedKeys={selectedKeys}
                onToggle={handleToggle}
                isAtLimit={isAtLimit}
              />
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="shrink-0">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      )}
    </form>
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
      </div>
      <button
        data-testid="select-safes-skip-link"
        type="button"
        onClick={handleSkip}
        disabled={isSubmitting}
        className="cursor-pointer text-sm font-semibold text-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        Skip, add Safes later
      </button>
    </div>
  )

  return (
    <>
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

      {pendingConfirmation && (
        <SimilarityConfirmDialog
          open
          safe={{ address: pendingConfirmation.address, name: pendingConfirmation.displayName }}
          onConfirm={confirmPending}
          onCancel={cancelPending}
        />
      )}
    </>
  )
}

export default SelectSafesOnboarding
