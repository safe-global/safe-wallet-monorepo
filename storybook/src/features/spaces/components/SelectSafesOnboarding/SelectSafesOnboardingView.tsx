import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import OnboardingFooter from '@views/components/common/OnboardingFooter'
import { Typography } from '@/components/ui/typography'
import { SearchInput } from '@/components/ui/search-input'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import SelectedCounter, { safeLimitTooltip } from '@views/features/spaces/components/SelectedCounter'
import SafeLimitError from '@views/features/spaces/components/SelectedCounter/SafeLimitError'

export type SelectSafesOnboardingViewProps = {
  formId: string
  onSubmit: FormEventHandler<HTMLFormElement>
  stepCounter: ReactNode
  isNameStep: boolean
  /** Set when no wallet is connected on the select step. */
  connectWalletHint?: ReactNode
  nameFields: ReactNode
  hasNoSafes: boolean
  seatCount: number
  limit: number | null | undefined
  isAtLimit: boolean
  onSearch: (value: string) => void
  noSearchResults: boolean
  safesList: ReactNode
  isLimitError: boolean
  onRetryLimit: () => void
  error?: string
}

export const SelectSafesOnboardingView = ({
  formId,
  onSubmit,
  stepCounter,
  isNameStep,
  connectWalletHint,
  nameFields,
  hasNoSafes,
  seatCount,
  limit,
  isAtLimit,
  onSearch,
  noSearchResults,
  safesList,
  isLimitError,
  onRetryLimit,
  error,
}: SelectSafesOnboardingViewProps): ReactElement => (
  <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-6">
    {stepCounter}

    <div className="flex flex-col gap-2 shrink-0">
      <Typography variant="h2">{isNameStep ? 'Name your Safe accounts' : 'Select Safe accounts'}</Typography>
      {!isNameStep && (
        <Typography variant="paragraph" color="muted">
          Select which Safe accounts to add to this Workspace. You can add more later.
        </Typography>
      )}
    </div>

    {connectWalletHint}

    {isNameStep ? (
      nameFields
    ) : hasNoSafes ? (
      <Alert variant="info" className="shrink-0">
        <AlertSeverityIcon variant="info" />
        <AlertDescription>You don&apos;t have any safes yet</AlertDescription>
      </Alert>
    ) : (
      <>
        <div className="flex shrink-0 items-center gap-3">
          <SelectedCounter count={seatCount} limit={limit} isAtLimit={isAtLimit} tooltip={safeLimitTooltip(limit)} />
          <SearchInput
            className="flex-1"
            placeholder="by name, address or network"
            aria-label="Search Safe list"
            autoComplete="off"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className="relative min-w-0" data-testid="onboarding-safes-list-region">
          {noSearchResults ? (
            <Typography variant="paragraph" align="center" color="muted" className="py-8">
              No safes match your search
            </Typography>
          ) : (
            safesList
          )}
        </div>

        {isLimitError && <SafeLimitError onRetry={onRetryLimit} />}
      </>
    )}

    {error && (
      <Alert variant="destructive" className="shrink-0">
        <AlertSeverityIcon variant="destructive" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}
  </form>
)

export type SelectSafesOnboardingFooterViewProps = {
  formId: string
  isNameStep: boolean
  onBack: () => void
  isSubmitting: boolean
  continueDisabled: boolean
  onSkip: () => void
}

export const SelectSafesOnboardingFooterView = ({
  formId,
  isNameStep,
  onBack,
  isSubmitting,
  continueDisabled,
  onSkip,
}: SelectSafesOnboardingFooterViewProps): ReactElement => (
  <div className="flex flex-col gap-3">
    <OnboardingFooter
      onBack={onBack}
      backDisabled={isSubmitting}
      continueLabel={isNameStep ? 'Add accounts' : 'Next'}
      continueType="submit"
      continueForm={formId}
      continueDisabled={continueDisabled}
      continueLoading={isSubmitting}
      continueTestId="select-safes-continue-button"
    />
    {!isNameStep && (
      <button
        data-testid="select-safes-skip-link"
        type="button"
        onClick={onSkip}
        disabled={isSubmitting}
        className="cursor-pointer text-sm font-semibold text-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        Skip, add Safe accounts later
      </button>
    )}
  </div>
)
