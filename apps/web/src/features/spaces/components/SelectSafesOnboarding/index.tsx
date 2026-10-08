import { useMemo, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { FormProvider, useWatch } from 'react-hook-form'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SimilarityConfirmDialog from '@/components/common/TrustedSafesModal/SimilarityConfirmDialog'
import { OnboardingLayout, StepCounter, SafeAppMockup, deriveSidePanelAccountsFromSpace } from '../OnboardingLayout'
import useWallet from '@/hooks/wallets/useWallet'
import CheckoutReturnModals from '../Plans/CheckoutReturnModals'
import ClaimTrialModal from '../Plans/ClaimTrialModal'
import { AppRoutes } from '@/config/routes'
import { type AllSafeItems } from '@/hooks/safes'
import { useSpaceSafes } from '../../hooks/useSpaceSafes'
import { useOnboardingStepCount } from '../../hooks/useOnboardingStepCount'
import OnboardingSafesList from './components/OnboardingSafesList'
import { useSpaceSafeLimit } from '../../hooks/useSpaceSafeLimit'
import ConnectWalletHint from '../ConnectWalletHint'
import { NameAccountsFields } from '../NameAccounts'
import useOnboardingNavigation from './hooks/useOnboardingNavigation'
import useOffersTrial from './hooks/useOffersTrial'
import useOnboardingSafes from './hooks/useOnboardingSafes'
import useOnboardingSubmit from './hooks/useOnboardingSubmit'
import useOnboardingSelection from './hooks/useOnboardingSelection'
import {
  deriveSidePanelAccounts,
  deriveSelectedBalanceSafes,
  deriveNameByAddress,
} from './utils/deriveSelectedAccounts'
import {
  SelectSafesOnboardingFooterView,
  SelectSafesOnboardingView,
} from '@views/features/spaces/components/SelectSafesOnboarding/SelectSafesOnboardingView'

const ONBOARDING_STEP = 2
const FORM_ID = 'select-safes-form'
const MOCKUP_HIGHLIGHT = 'accounts'
const TRIAL_CTA_LABEL = 'Get started'
const CLAIM_TRIAL_VARIANT = 'new'

const SelectSafesOnboarding = (): ReactElement => {
  const wallet = useWallet()
  const totalSteps = useOnboardingStepCount()
  const { spaceId, handleBack, handleSkip, redirectToNextStep, nextStepUrl } = useOnboardingNavigation()
  const router = useRouter()
  const offersTrial = useOffersTrial(spaceId)
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
  const {
    formMethods,
    onSubmit,
    selectedSafesLength,
    error,
    isSubmitting,
    isAddressBookReady,
    step,
    safesToName,
    showSelectStep,
  } = useOnboardingSubmit(spaceId, redirectToNextStep, allSafes, nextStepUrl)
  const isNameStep = step === 'name'

  const { control, setValue } = formMethods
  const { limit, isError: isLimitError, retry: retryLimit } = useSpaceSafeLimit(spaceId)
  const {
    selectedKeys,
    seatCount,
    isAtLimit,
    isSelectionLocked,
    handleToggle,
    pendingConfirmation,
    confirmPending,
    cancelPending,
  } = useOnboardingSelection({ items: allSafes, control, setValue, flaggedAddresses, limit })

  const { data: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !spaceId })
  const { allSafes: spaceSafes } = useSpaceSafes()

  const selectedSafes = useWatch({ control, name: 'selectedSafes' })
  const typedNames = useWatch({ control, name: 'names' })

  const nameByAddress = useMemo(() => deriveNameByAddress(allSafes), [allSafes])

  // Form starts empty; fall back to persisted Space safes so the mockup isn't blank on back-nav.
  // Names typed in the naming step win, so the mockup previews the workspace as it will be.
  const sidePanelAccounts = useMemo(() => {
    const isFormInitialized = Object.keys(selectedSafes ?? {}).length > 0
    const accounts = isFormInitialized
      ? deriveSidePanelAccounts(selectedSafes ?? {}, allSafes)
      : deriveSidePanelAccountsFromSpace(spaceSafes).map((a) => ({
          ...a,
          name: a.name?.trim() || nameByAddress.get(a.address.toLowerCase()),
        }))
    return accounts.map((a) => ({ ...a, name: typedNames?.[a.address.toLowerCase()]?.trim() || a.name }))
  }, [selectedSafes, allSafes, spaceSafes, nameByAddress, typedNames])

  const balanceSafes = useMemo(
    () => deriveSelectedBalanceSafes(selectedSafes ?? {}, allSafes, spaceSafes),
    [selectedSafes, allSafes, spaceSafes],
  )

  const noSearchResults = !hasNoSafes && trustedSafes.length === 0 && ownedSafes.length === 0

  const main = (
    <FormProvider {...formMethods}>
      <SelectSafesOnboardingView
        formId={FORM_ID}
        onSubmit={onSubmit}
        stepCounter={<StepCounter currentStep={ONBOARDING_STEP} totalSteps={totalSteps} />}
        isNameStep={isNameStep}
        connectWalletHint={
          !wallet && !isNameStep ? <ConnectWalletHint testId="select-safes-connect-wallet-button" /> : undefined
        }
        nameFields={<NameAccountsFields items={safesToName} />}
        hasNoSafes={hasNoSafes}
        seatCount={seatCount}
        limit={limit}
        isAtLimit={isAtLimit}
        onSearch={handleSearch}
        noSearchResults={noSearchResults}
        safesList={
          <OnboardingSafesList
            trustedSafes={trustedSafes}
            ownedSafes={ownedSafes}
            flaggedAddresses={flaggedAddresses}
            trustedSimilarityGroups={trustedSimilarityGroups}
            ownedSimilarityGroups={ownedSimilarityGroups}
            similarWarnings={similarWarnings}
            selectedKeys={selectedKeys}
            onToggle={handleToggle}
            isAtLimit={isSelectionLocked}
          />
        }
        isLimitError={isLimitError}
        onRetryLimit={retryLimit}
        error={error}
      />
    </FormProvider>
  )

  const footer = (
    <SelectSafesOnboardingFooterView
      formId={FORM_ID}
      isNameStep={isNameStep}
      onBack={isNameStep ? showSelectStep : handleBack}
      isSubmitting={isSubmitting}
      continueDisabled={selectedSafesLength === 0 || isSubmitting || !isAddressBookReady}
      onSkip={handleSkip}
    />
  )

  return (
    <>
      <OnboardingLayout
        main={main}
        footer={footer}
        sidePanel={
          <SafeAppMockup
            name={space?.name ?? ''}
            highlight={MOCKUP_HIGHLIGHT}
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

      {spaceId && <CheckoutReturnModals spaceId={spaceId} trialCtaLabel={TRIAL_CTA_LABEL} />}

      {offersTrial && spaceId && (
        <ClaimTrialModal
          spaceId={spaceId}
          variant={CLAIM_TRIAL_VARIANT}
          returnPathname={AppRoutes.welcome.selectSafes}
          onBack={() => router.push(AppRoutes.welcome.accounts)}
        />
      )}
    </>
  )
}

export default SelectSafesOnboarding
