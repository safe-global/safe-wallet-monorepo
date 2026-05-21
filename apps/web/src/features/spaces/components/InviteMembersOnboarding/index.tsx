import type { ReactElement } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import OnboardingLayout from '../OnboardingLayout'
import OnboardingIllustration from '../OnboardingLayout/Illustration'
import MemberInviteRow from './components/MemberInviteRow'
import useInviteNavigation from './hooks/useInviteNavigation'
import useInviteForm from './hooks/useInviteForm'

const ONBOARDING_STEP = 3
const TOTAL_STEPS = 3

const InviteMembersOnboarding = (): ReactElement => {
  const { spaceId, goBack, redirectToNextStep } = useInviteNavigation()
  const { data: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !spaceId })
  const { control, formState, register, setValue, trigger, fields, append, remove, onSubmit, error, isSubmitting } =
    useInviteForm(spaceId, redirectToNextStep)

  return (
    <form onSubmit={onSubmit}>
      <OnboardingLayout
        step={{ current: ONBOARDING_STEP, total: TOTAL_STEPS }}
        title="Invite team members"
        description="Add people to collaborate on this Space."
        illustration={<OnboardingIllustration variant="invite-members" spaceName={space?.name} />}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={goBack}
              className="rounded-full px-5"
              disabled={isSubmitting}
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>
            <Button
              data-testid="invite-members-skip-button"
              type="button"
              variant="ghost"
              size="lg"
              onClick={redirectToNextStep}
              disabled={isSubmitting}
              className="ml-auto rounded-full px-5"
            >
              Skip
            </Button>
            <Button
              data-testid="invite-members-continue-button"
              type="submit"
              size="lg"
              disabled={!formState.isValid || isSubmitting}
              className="rounded-full px-6"
            >
              {isSubmitting ? <Spinner /> : 'Finish'}
            </Button>
          </>
        }
      >
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
          className="flex cursor-pointer items-center gap-2 self-start text-foreground hover:text-foreground/80"
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
      </OnboardingLayout>
    </form>
  )
}

export default InviteMembersOnboarding
