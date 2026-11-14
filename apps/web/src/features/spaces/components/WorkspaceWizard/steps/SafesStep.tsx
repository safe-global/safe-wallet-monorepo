import { useMemo, type ReactElement } from 'react'
import { FormProvider } from 'react-hook-form'
import OnboardingFooter from '@safe-global/views/components/common/OnboardingFooter'
import SafesPicker from '@safe-global/views/features/spaces/components/WorkspaceWizard/SafesPicker'
import SimilarityConfirmDialog from '@/components/common/TrustedSafesModal/SimilarityConfirmDialog'
import type { AllSafeItems } from '@/hooks/safes'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import useWallet from '@/hooks/wallets/useWallet'
import ConnectWalletHint from '../../ConnectWalletHint'
import { NameAccountsFields } from '../../NameAccounts'
import OnboardingSafesList from '../../SelectSafesOnboarding/components/OnboardingSafesList'
import useOnboardingSafes from '../../SelectSafesOnboarding/hooks/useOnboardingSafes'
import { useSafesStepForm } from '../hooks/useSafesStepForm'
import { useStepAdvance } from '../hooks/useStepAdvance'
import { useTrialSizes } from '../hooks/useTrialSizes'
import { useWorkspaceDraft } from '../hooks/useWorkspaceDraft'
import { getPickedSize, validateStep } from '../validation'
import WizardFrame from '../WizardFrame'

const FORM_ID = 'workspace-safes-form'

const SafesStep = (): ReactElement => {
  const wallet = useWallet()
  const isSafePro = useIsSafeProEnabled()
  const { draft } = useWorkspaceDraft()
  const { sizes } = useTrialSizes()
  const { stepNumber, totalSteps, advance, retreat } = useStepAdvance('safes')
  const safes = useOnboardingSafes()
  const allSafes = useMemo<AllSafeItems>(() => [...safes.trustedSafes, ...safes.ownedSafes], [safes])

  const pickedSize = getPickedSize(draft, { sizes })
  const limit = isSafePro ? pickedSize?.seats : null
  const form = useSafesStepForm({
    draft,
    allSafes,
    flaggedAddresses: safes.flaggedAddresses,
    limit,
    advance,
    retreat,
  })
  const { selection, pickedSafes, isNameStep } = form
  const limitError = validateStep('safes', { ...draft, safes: pickedSafes }, { sizes })

  const subtitle = isNameStep
    ? undefined
    : pickedSize
      ? `Your ${pickedSize.planName} trial includes ${pickedSize.seats} Safe accounts.`
      : 'Select which Safe accounts to add to this Workspace. You can add more later.'

  return (
    <>
      <WizardFrame
        draft={{ ...draft, safes: pickedSafes }}
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        title={isNameStep ? 'Name your Safe accounts' : 'Add Safe accounts'}
        subtitle={subtitle}
        highlight="accounts"
        footer={
          <div className="flex flex-col gap-3">
            <OnboardingFooter
              onBack={form.onBack}
              continueLabel="Next"
              continueType="submit"
              continueForm={FORM_ID}
              continueDisabled={pickedSafes.length === 0 || limitError !== null}
              continueTestId="select-safes-continue-button"
            />
            {!isNameStep && (
              <button
                data-testid="select-safes-skip-link"
                type="button"
                onClick={form.onSkip}
                className="cursor-pointer text-sm font-semibold text-foreground underline-offset-4 hover:underline"
              >
                Skip, add Safe accounts later
              </button>
            )}
          </div>
        }
      >
        <FormProvider {...form.formMethods}>
          <form id={FORM_ID} onSubmit={form.onSubmit} className="flex flex-col gap-6">
            {isNameStep ? (
              <NameAccountsFields items={form.safesToName} />
            ) : (
              <SafesPicker
                hint={wallet ? undefined : <ConnectWalletHint testId="select-safes-connect-wallet-button" />}
                hasNoSafes={safes.hasNoSafes}
                hasNoResults={!safes.hasNoSafes && allSafes.length === 0}
                seatCount={selection.seatCount}
                limit={limit}
                isAtLimit={selection.isAtLimit}
                onSearch={safes.handleSearch}
                list={
                  <OnboardingSafesList
                    trustedSafes={safes.trustedSafes}
                    ownedSafes={safes.ownedSafes}
                    flaggedAddresses={safes.flaggedAddresses}
                    trustedSimilarityGroups={safes.trustedSimilarityGroups}
                    ownedSimilarityGroups={safes.ownedSimilarityGroups}
                    similarWarnings={safes.similarWarnings}
                    selectedKeys={selection.selectedKeys}
                    onToggle={selection.handleToggle}
                    isAtLimit={selection.isSelectionLocked}
                  />
                }
                error={limitError}
              />
            )}
          </form>
        </FormProvider>
      </WizardFrame>

      {selection.pendingConfirmation && (
        <SimilarityConfirmDialog
          open
          safe={{ address: selection.pendingConfirmation.address, name: selection.pendingConfirmation.displayName }}
          onConfirm={selection.confirmPending}
          onCancel={selection.cancelPending}
        />
      )}
    </>
  )
}

export default SafesStep
