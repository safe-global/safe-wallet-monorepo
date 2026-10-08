import { useMemo, type ReactElement } from 'react'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
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
import {
  InviteMembersOnboardingFooterView,
  InviteMembersOnboardingView,
} from '@views/features/spaces/components/InviteMembersOnboarding/InviteMembersOnboardingView'

const ONBOARDING_STEP = 3
const SIDE_PANEL_HIGHLIGHT = 'accounts'

const InviteMembersOnboarding = (): ReactElement => {
  const totalSteps = useOnboardingStepCount()
  const { spaceId, goBack, redirectToNextStep, nextStepUrl } = useInviteNavigation()
  const { control, formState, register, setValue, trigger, fields, append, remove, onSubmit, error, isSubmitting } =
    useInviteForm(spaceId, redirectToNextStep, nextStepUrl)

  const { data: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !spaceId })
  const { allSafes: spaceSafes } = useSpaceSafes()
  const nameLookup = useSafeNameLookup()
  const sidePanelAccounts = useMemo(
    () => deriveSidePanelAccountsFromSpace(spaceSafes, nameLookup),
    [spaceSafes, nameLookup],
  )
  const balanceSafes = useMemo(() => flattenSafeItems(spaceSafes), [spaceSafes])

  const main = (
    <InviteMembersOnboardingView
      onSubmit={onSubmit}
      stepCounter={<StepCounter currentStep={ONBOARDING_STEP} totalSteps={totalSteps} />}
      rows={fields.map((field, index) => (
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
      onAddAnother={() => append({ identifier: '', role: MemberRole.MEMBER })}
      error={error}
    />
  )

  const footer = (
    <InviteMembersOnboardingFooterView
      onBack={goBack}
      onSkip={redirectToNextStep}
      isSubmitting={isSubmitting}
      isValid={formState.isValid}
    />
  )

  return (
    <OnboardingLayout
      main={main}
      footer={footer}
      sidePanel={
        <SafeAppMockup
          name={space?.name ?? ''}
          highlight={SIDE_PANEL_HIGHLIGHT}
          accounts={sidePanelAccounts}
          balanceSafes={balanceSafes}
        />
      }
    />
  )
}

export default InviteMembersOnboarding
