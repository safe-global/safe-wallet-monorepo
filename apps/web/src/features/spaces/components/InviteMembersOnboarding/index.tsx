import type { ReactElement } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import StepIndicator from '@/features/spaces/components/StepIndicator'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import MemberInviteRow from './components/MemberInviteRow'
import useInviteNavigation from './hooks/useInviteNavigation'
import useInviteForm from './hooks/useInviteForm'

const ONBOARDING_STEP = 3
const TOTAL_STEPS = 3

const InviteMembersOnboarding = (): ReactElement => {
  const isDarkMode = useDarkMode()
  const { spaceId, goBack, redirectToNextStep } = useInviteNavigation()
  const { control, formState, register, setValue, trigger, fields, append, remove, onSubmit, error, isSubmitting } =
    useInviteForm(spaceId, redirectToNextStep)

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
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

          <Typography variant="h2" align="center">
            Invite team members
          </Typography>

          <Typography variant="paragraph" align="center" color="muted" className="mx-auto w-[93%]">
            Add people to collaborate on this Space.
          </Typography>

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

          <div className="flex flex-col gap-5">
            <Button
              data-testid="invite-members-continue-button"
              type="submit"
              size="lg"
              disabled={!formState.isValid || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? <Spinner /> : 'Finish'}
            </Button>

            <Button
              data-testid="invite-members-skip-button"
              type="button"
              variant="ghost"
              size="lg"
              onClick={redirectToNextStep}
              disabled={isSubmitting}
              className="w-full hover:bg-card"
            >
              Skip
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InviteMembersOnboarding
