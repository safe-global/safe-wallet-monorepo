import { useMemo, type ReactElement } from 'react'
import { useWatch } from 'react-hook-form'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import OnboardingFooter from '@/components/common/OnboardingFooter'
import { Typography } from '@/components/ui/typography'
import { SearchInput } from '@/components/ui/search-input'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import SimilarityConfirmDialog from '@/components/common/TrustedSafesModal/SimilarityConfirmDialog'
import { OnboardingLayout, StepCounter, SafeAppMockup, deriveSidePanelAccountsFromSpace } from '../OnboardingLayout'
import useWallet from '@/hooks/wallets/useWallet'
import { type AllSafeItems } from '@/hooks/safes'
import { SAFE_ACCOUNTS_LIMIT } from '../../constants'
import { useSpaceSafes } from '../../hooks/useSpaceSafes'
import { useOnboardingStepCount } from '../../hooks/useOnboardingStepCount'
import OnboardingSafesList from './components/OnboardingSafesList'
import SelectedCounter from './components/SelectedCounter'
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
  const {
    trustedSafes,
    ownedSafes,
    flaggedAddresses,
    trustedSimilarityGroups,
    ownedSimilarityGroups,
    similarWarnings,
    handleSearch,
    hasNoSafes,
  } = useOnboardingSafes()
  const allSafes = useMemo<AllSafeItems>(() => [...trustedSafes, ...ownedSafes], [trustedSafes, ownedSafes])
  const { formMethods, onSubmit, selectedSafesLength, error, isSubmitting } = useOnboardingSubmit(
    spaceId,
    redirectToNextStep,
    allSafes,
  )

  const { control, setValue } = formMethods
  const { selectedKeys, isAtLimit, handleToggle, pendingConfirmation, confirmPending, cancelPending } =
    useOnboardingSelection({ items: allSafes, control, setValue, flaggedAddresses })

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
        <Alert variant="info" className="shrink-0">
          <AlertSeverityIcon variant="info" />
          <AlertDescription>You don&apos;t have any safes yet</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex shrink-0 items-center gap-3">
            <SelectedCounter
              count={selectedKeys.size}
              limit={SAFE_ACCOUNTS_LIMIT}
              isAtLimit={isAtLimit}
              tooltip={`You can add up to ${SAFE_ACCOUNTS_LIMIT} Safe accounts per Workspace`}
            />
            <SearchInput
              className="flex-1"
              placeholder="by name, address or network"
              aria-label="Search Safe list"
              autoComplete="off"
              onChange={(e) => handleSearch(e.target.value)}
            />
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
                flaggedAddresses={flaggedAddresses}
                trustedSimilarityGroups={trustedSimilarityGroups}
                ownedSimilarityGroups={ownedSimilarityGroups}
                similarWarnings={similarWarnings}
                selectedKeys={selectedKeys}
                onToggle={handleToggle}
                isAtLimit={isAtLimit}
              />
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="shrink-0">
              <AlertSeverityIcon variant="destructive" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      )}
    </form>
  )

  const footer = (
    <div className="flex flex-col gap-3">
      <OnboardingFooter
        onBack={handleBack}
        backDisabled={isSubmitting}
        continueLabel="Next"
        continueType="submit"
        continueForm={FORM_ID}
        continueDisabled={selectedSafesLength === 0 || isSubmitting}
        continueLoading={isSubmitting}
        continueTestId="select-safes-continue-button"
      />
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
