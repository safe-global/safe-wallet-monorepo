import { useState, type ReactElement } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Plus } from 'lucide-react'
import OnboardingFooter from '@safe-global/views/components/common/OnboardingFooter'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Typography } from '@safe-global/views/components/ui/typography'
import type { DraftInvite, WorkspaceDraft } from '@/features/spaces/store'
import { MemberRole } from '../../../memberRole'
import MemberInviteRow from '../../InviteMembersOnboarding/components/MemberInviteRow'
import type { InviteMembersFormValues } from '../../InviteMembersOnboarding/hooks/useInviteForm'
import { useStepAdvance } from '../hooks/useStepAdvance'
import { useWorkspaceDraft } from '../hooks/useWorkspaceDraft'
import { validateStep } from '../validation'
import TrialConfirmNote from '../TrialConfirmNote'
import WizardFrame from '../WizardFrame'

const FORM_ID = 'workspace-invite-form'
const EMPTY_ROW = { identifier: '', role: MemberRole.MEMBER }

const toDraftInvites = (members: InviteMembersFormValues['members']): DraftInvite[] =>
  members.map((member) => ({ ...member, identifier: member.identifier.trim() })).filter((member) => member.identifier)

const toInviteForm = (draft: WorkspaceDraft): InviteMembersFormValues => ({
  members: draft.invites.length > 0 ? draft.invites : [EMPTY_ROW],
})

const InviteStep = (): ReactElement => {
  const { draft, ownAddresses } = useWorkspaceDraft()
  const { stepNumber, totalSteps, advance, retreat, continueLabel, submitError, isSubmitting, isLastStep } =
    useStepAdvance('invite')
  const [error, setError] = useState<string>()
  const { control, formState, register, setValue, trigger, getValues, handleSubmit } = useForm<InviteMembersFormValues>(
    { mode: 'onChange', defaultValues: toInviteForm(draft) },
  )
  const { fields, append, remove } = useFieldArray({ control, name: 'members' })

  const onSubmit = handleSubmit(({ members }) => {
    const invites = toDraftInvites(members)
    const stepError = validateStep('invite', { ...draft, invites }, { ownAddresses })
    setError(stepError ?? undefined)
    if (!stepError) advance({ invites })
  })

  const shownError = error ?? submitError

  return (
    <WizardFrame
      draft={draft}
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      title="Invite your team"
      subtitle="Members can view, propose and sign from the Workspace. They get the invite once your trial starts."
      highlight="accounts"
      footer={
        <div className="flex flex-col gap-3">
          <OnboardingFooter
            onBack={() => retreat({ invites: toDraftInvites(getValues('members')) })}
            backDisabled={isSubmitting}
            continueLabel={continueLabel}
            continueType="submit"
            continueForm={FORM_ID}
            continueDisabled={!formState.isValid || isSubmitting}
            continueLoading={isSubmitting}
            continueTestId="invite-members-continue-button"
          />
          <button
            data-testid="invite-members-skip-button"
            type="button"
            onClick={() => advance({ invites: [] })}
            disabled={isSubmitting}
            className="cursor-pointer text-sm font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Skip, invite later
          </button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <MemberInviteRow
              key={field.id}
              index={index}
              control={control}
              register={register}
              errors={formState.errors}
              setValue={setValue}
              trigger={trigger}
              canRemove={fields.length > 1}
              onRemove={() => {
                remove(index)
                setTimeout(() => trigger('members'), 0)
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => append(EMPTY_ROW)}
          className="flex cursor-pointer items-center justify-center gap-2"
          data-testid="add-another-member"
        >
          <Plus className="size-4" />
          <Typography variant="paragraph-small-medium">Add another</Typography>
        </button>

        {shownError && (
          <Alert variant="destructive">
            <AlertSeverityIcon variant="destructive" />
            <AlertDescription>{shownError}</AlertDescription>
          </Alert>
        )}

        {isLastStep && <TrialConfirmNote />}
      </form>
    </WizardFrame>
  )
}

export default InviteStep
