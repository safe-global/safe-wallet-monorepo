import type { FocusEvent, ChangeEvent, FormEvent, ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import OnboardingFooter from '@/components/common/OnboardingFooter'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertAction, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

const FORM_ID = 'create-space-form'

export type CreateSpaceOnboardingViewProps = {
  showClaimTrial: boolean
  renderClaimTrialModal: (props: { variant: 'new' }) => ReactNode
  stepCounter: ReactNode
  onSubmit: (e?: FormEvent<HTMLFormElement>) => void
  nameReg: UseFormRegisterReturn<'name'>
  onNameChange: (e: ChangeEvent<HTMLInputElement>) => void
  onNameBlur: (e: FocusEvent<HTMLInputElement>) => void
  isInputDisabled: boolean
  nameError?: string
  isSpaceLoading: boolean
  error?: string
  isTrialCheckFailed: boolean
  onRetryTrialCheck: () => void
}

export const CreateSpaceOnboardingView = ({
  showClaimTrial,
  renderClaimTrialModal,
  stepCounter,
  onSubmit,
  nameReg,
  onNameChange,
  onNameBlur,
  isInputDisabled,
  nameError,
  isSpaceLoading,
  error,
  isTrialCheckFailed,
  onRetryTrialCheck,
}: CreateSpaceOnboardingViewProps) => {
  return (
    <>
      {showClaimTrial && renderClaimTrialModal({ variant: 'new' })}
      {stepCounter}

      <div className="flex flex-col gap-2">
        <Typography variant="h2">Create a Workspace</Typography>
        <Typography variant="paragraph" color="muted">
          Your team&apos;s home for managing Safes, tracking activity, and collaborating.
        </Typography>
      </div>

      <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="relative">
          <label htmlFor="space-name" className="m-0 text-sm leading-5 font-medium">
            Workspace name
          </label>
          <Input
            id="space-name"
            data-testid="space-name-input"
            placeholder="e.g. Treasury Ops, DeFi Team"
            autoComplete="off"
            disabled={isInputDisabled}
            variant="surface"
            // eslint-disable-next-line no-restricted-syntax -- bespoke 44px onboarding field (h-11, rounded-sm, px-4); between the lg/xl tiers, no size fits
            className="mt-2 h-11 rounded-sm px-4"
            {...nameReg}
            onChange={onNameChange}
            error={nameError}
            onBlur={onNameBlur}
          />
          {isSpaceLoading && (
            <div className="absolute right-3 top-[2.4rem]">
              <Spinner className="size-4" />
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertSeverityIcon variant="destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isTrialCheckFailed && (
          <Alert variant="destructive" data-testid="trial-check-error">
            <AlertSeverityIcon variant="destructive" />
            <AlertDescription>
              We couldn&apos;t check your Workspace&apos;s free access. Please try again.
            </AlertDescription>
            <AlertAction>
              <Button type="button" variant="outline" size="sm" onClick={onRetryTrialCheck}>
                Try again
              </Button>
            </AlertAction>
          </Alert>
        )}
      </form>
    </>
  )
}

export type CreateSpaceOnboardingFooterViewProps = {
  onBack: () => void
  backDisabled: boolean
  continueDisabled: boolean
  continueLoading: boolean
}

export const CreateSpaceOnboardingFooterView = ({
  onBack,
  backDisabled,
  continueDisabled,
  continueLoading,
}: CreateSpaceOnboardingFooterViewProps) => (
  <OnboardingFooter
    onBack={onBack}
    backDisabled={backDisabled}
    continueLabel="Next"
    continueType="submit"
    continueForm={FORM_ID}
    continueDisabled={continueDisabled}
    continueLoading={continueLoading}
    continueTestId="create-space-onboarding-continue-button"
  />
)
