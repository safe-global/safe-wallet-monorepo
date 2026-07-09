import { useMemo, type ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import OnboardingFooter from '@/components/common/OnboardingFooter'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  OnboardingLayout,
  StepCounter,
  SafeAppMockup,
  deriveSidePanelAccountsFromSpace,
  useSafeNameLookup,
} from '../OnboardingLayout'
import { useSpaceSafes } from '../../hooks/useSpaceSafes'
import { useOnboardingStepCount } from '../../hooks/useOnboardingStepCount'
import { flattenSafeItems } from '@/hooks/safes'
import MemberInviteRow from './components/MemberInviteRow'
import useInviteNavigation from './hooks/useInviteNavigation'
import useInviteForm from './hooks/useInviteForm'
import { MemberRole } from '../../hooks/useSpaceMembers'

const ONBOARDING_STEP = 3
const FORM_ID = 'invite-members-form'

const InviteMembersOnboarding = (): ReactElement => {
  const totalSteps = useOnboardingStepCount()
  const { spaceId, goBack, redirectToNextStep } = useInviteNavigation()
  const { control, formState, register, setValue, trigger, fields, append, remove, onSubmit, error, isSubmitting } =
    useInviteForm(spaceId, redirectToNextStep)

  const { data: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !spaceId })
  const { allSafes: spaceSafes } = useSpaceSafes()
  const nameLookup = useSafeNameLookup()
  const sidePanelAccounts = useMemo(
    () => deriveSidePanelAccountsFromSpace(spaceSafes, nameLookup),
    [spaceSafes, nameLookup],
  )
  const balanceSafes = useMemo(() => flattenSafeItems(spaceSafes), [spaceSafes])

  const main = (
    <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-6">
      <StepCounter currentStep={ONBOARDING_STEP} totalSteps={totalSteps} />

      <div className="flex flex-col gap-2">
        <Typography variant="h2">Invite your team</Typography>
        <Typography variant="paragraph" color="muted">
          Add people to collaborate on this Workspace.
        </Typography>
      </div>

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
        onClick={() => append({ identifier: '', role: MemberRole.MEMBER })}
        className="flex cursor-pointer items-center justify-center gap-2"
        data-testid="add-another-member"
      >
        <Plus className="size-4" />
        <Typography variant="paragraph-small-medium">Add another</Typography>
      </button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  )

  const footer = (
    <div className="flex flex-col gap-3">
      <OnboardingFooter
        onBack={goBack}
        backDisabled={isSubmitting}
        continueLabel="Next"
        continueType="submit"
        continueForm={FORM_ID}
        continueDisabled={!formState.isValid || isSubmitting}
        continueLoading={isSubmitting}
        continueTestId="invite-members-continue-button"
      />
      <button
        data-testid="invite-members-skip-button"
        type="button"
        onClick={redirectToNextStep}
        disabled={isSubmitting}
        className="cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        Skip, invite later
      </button>
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

export default InviteMembersOnboarding
