import type { FormEvent, ReactNode } from 'react'
import { Plus } from 'lucide-react'
import OnboardingFooter from '@/components/common/OnboardingFooter'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'

const FORM_ID = 'invite-members-form'

export type InviteMembersOnboardingViewProps = {
  onSubmit: (e?: FormEvent<HTMLFormElement>) => void
  stepCounter: ReactNode
  rows: ReactNode
  onAddAnother: () => void
  error?: string
}

export const InviteMembersOnboardingView = ({
  onSubmit,
  stepCounter,
  rows,
  onAddAnother,
  error,
}: InviteMembersOnboardingViewProps) => {
  return (
    <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-6">
      {stepCounter}

      <div className="flex flex-col gap-2">
        <Typography variant="h2">Invite your team</Typography>
        <Typography variant="paragraph" color="muted">
          Add people to collaborate on this Workspace.
        </Typography>
      </div>

      <div className="flex flex-col gap-3">{rows}</div>

      <button
        type="button"
        onClick={onAddAnother}
        className="flex cursor-pointer items-center justify-center gap-2"
        data-testid="add-another-member"
      >
        <Plus className="size-4" />
        <Typography variant="paragraph-small-medium">Add another</Typography>
      </button>

      {error && (
        <Alert variant="destructive">
          <AlertSeverityIcon variant="destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}

export type InviteMembersOnboardingFooterViewProps = {
  onBack: () => void
  onSkip: () => void
  isSubmitting: boolean
  isValid: boolean
}

export const InviteMembersOnboardingFooterView = ({
  onBack,
  onSkip,
  isSubmitting,
  isValid,
}: InviteMembersOnboardingFooterViewProps) => (
  <div className="flex flex-col gap-3">
    <OnboardingFooter
      onBack={onBack}
      backDisabled={isSubmitting}
      continueLabel="Next"
      continueType="submit"
      continueForm={FORM_ID}
      continueDisabled={!isValid || isSubmitting}
      continueLoading={isSubmitting}
      continueTestId="invite-members-continue-button"
    />
    <button
      data-testid="invite-members-skip-button"
      type="button"
      onClick={onSkip}
      disabled={isSubmitting}
      className="cursor-pointer text-sm font-semibold text-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      Skip, invite later
    </button>
  </div>
)
