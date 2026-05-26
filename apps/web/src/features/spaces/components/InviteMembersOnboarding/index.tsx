import { useMemo, type ReactElement } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import {
  OnboardingLayout,
  StepCounter,
  SpaceSidePanel,
  deriveSidePanelAccountsFromSpace,
  useSafeNameLookup,
} from '@/features/spaces/components/OnboardingLayout'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import MemberInviteRow from './components/MemberInviteRow'
import useInviteNavigation from './hooks/useInviteNavigation'
import useInviteForm from './hooks/useInviteForm'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'

const ONBOARDING_STEP = 3
const TOTAL_STEPS = 4
const FORM_ID = 'invite-members-form'

const InviteMembersOnboarding = (): ReactElement => {
  const { spaceId, goBack, redirectToNextStep } = useInviteNavigation()
  const { control, formState, register, setValue, trigger, fields, append, remove, onSubmit, error, isSubmitting } =
    useInviteForm(spaceId, redirectToNextStep)

  const { data: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !spaceId })
  const { allSafes: spaceSafes } = useSpaceSafes()
  const nameLookup = useSafeNameLookup()
  const sidePanelAccounts = useMemo(
    () => deriveSidePanelAccountsFromSpace(spaceSafes, nameLookup),
    [spaceSafes, nameLookup],
  )

  const main = (
    <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-6">
      <StepCounter currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />

      <div className="flex flex-col gap-2">
        <Typography variant="h2">Invite your team</Typography>
        <Typography variant="paragraph" color="muted">
          Add people to collaborate on this Space.
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
        onClick={() => append({ address: '', role: MemberRole.MEMBER })}
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
      <div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={isSubmitting}
          className="w-full h-12 rounded-lg bg-muted hover:bg-border lg:flex-1"
        >
          <ChevronLeft className="size-4 mr-1" />
          Back
        </Button>
        <Button
          data-testid="invite-members-continue-button"
          type="submit"
          form={FORM_ID}
          disabled={!formState.isValid || isSubmitting}
          className="w-full h-12 rounded-lg text-[15px] lg:flex-1"
        >
          {isSubmitting ? <Spinner /> : 'Next'}
        </Button>
      </div>
      <button
        data-testid="invite-members-skip-button"
        type="button"
        onClick={redirectToNextStep}
        disabled={isSubmitting}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
      >
        Skip, invite later
      </button>
    </div>
  )

  return (
    <OnboardingLayout
      main={main}
      footer={footer}
      sidePanel={<SpaceSidePanel name={space?.name ?? ''} highlight="accounts" accounts={sidePanelAccounts} />}
    />
  )
}

export default InviteMembersOnboarding
