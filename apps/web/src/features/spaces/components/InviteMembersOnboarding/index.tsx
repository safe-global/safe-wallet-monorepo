import type { ReactElement } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import StepIndicator from '@/features/spaces/components/StepIndicator'
import MemberInviteRow from './components/MemberInviteRow'
import useInviteNavigation from './hooks/useInviteNavigation'
import useInviteForm from './hooks/useInviteForm'

const ONBOARDING_STEP = 3
const TOTAL_STEPS = 3

const InviteMembersOnboarding = (): ReactElement => {
  const { spaceId, isReady, goBack, redirectToNextStep } = useInviteNavigation()
  const { control, formState, register, setValue, fields, append, remove, onSubmit, error, isSubmitting } =
    useInviteForm(spaceId, redirectToNextStep)

  if (!isReady) {
    return <></>
  }

  return (
    <div className="shadcn-scope">
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <form onSubmit={onSubmit} className="flex w-full max-w-[400px] flex-col gap-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="rounded-md border border-card shadow-sm"
          >
            <ChevronLeft className="size-5" />
          </Button>

          <div className="flex items-center justify-center">
            <StepIndicator currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />
          </div>

          <h2 className="w-full text-center text-[30px] font-semibold leading-[30px] tracking-[-1px] text-foreground">
            Invite team members
          </h2>

          <p className="mx-auto w-[93%] text-center text-base leading-6 text-muted-foreground">
            Add people to collaborate on this space.
          </p>

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <MemberInviteRow
                key={field.id}
                index={index}
                control={control}
                register={register}
                setValue={setValue}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => append({ address: '', role: MemberRole.MEMBER })}
            className="flex cursor-pointer items-center justify-center gap-2 text-sm font-medium text-foreground"
            data-testid="add-another-member"
          >
            <Plus className="size-4" />
            Add another
          </button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            data-testid="invite-members-continue-button"
            type="submit"
            size="lg"
            disabled={!formState.isValid || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? <Spinner /> : 'Continue'}
          </Button>

          <Button
            data-testid="invite-members-skip-button"
            type="button"
            variant="ghost"
            size="lg"
            onClick={redirectToNextStep}
            disabled={isSubmitting}
            className="w-full"
          >
            Skip
          </Button>
        </form>
      </div>
    </div>
  )
}

export default InviteMembersOnboarding
