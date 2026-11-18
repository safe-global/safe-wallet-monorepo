import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { formatDistanceToNow } from 'date-fns'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import WizardNotice from '@safe-global/views/features/spaces/components/WorkspaceWizard/WizardNotice'
import type { TrialSize } from '@safe-global/views/features/spaces/components/Plans/types'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { clearWorkspaceDraft, EMPTY_WORKSPACE_DRAFT, type WorkspaceDraft } from '../../public/store/workspaceDraftSlice'
import { resumeOfferAnswered, selectIsResumeOffered } from '../../public/store/workspaceWizardSlice'
import { countSeats } from '@/utils/spaces'
import { useTrialSizes } from './hooks/useTrialSizes'
import { useWizardNavigation } from './hooks/useWizardNavigation'
import { useWorkspaceDraft } from './hooks/useWorkspaceDraft'
import { finishSetupRoute } from './steps'
import { findFirstInvalidStep, getPickedSize } from './validation'

const hasContent = (draft: WorkspaceDraft): boolean =>
  draft.name !== EMPTY_WORKSPACE_DRAFT.name ||
  draft.paymentLinkId !== null ||
  draft.safes.length > 0 ||
  draft.invites.length > 0

const count = (quantity: number, word: string) => `${quantity} ${word}${maybePlural(quantity)}`

/** One line about the saved draft, e.g. "Treasury Ops · Business 10 · 4 Safes · 2 invites · started 2 days ago". */
export const summarizeDraft = (draft: WorkspaceDraft, size: TrialSize | undefined): string =>
  [
    draft.name,
    size ? `${size.planName} ${size.seats}` : undefined,
    count(countSeats(draft.safes.map((safe) => safe.address)), 'Safe'),
    count(draft.invites.length, 'invite'),
    draft.updatedAt ? `started ${formatDistanceToNow(draft.updatedAt, { addSuffix: true })}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ')

/** Above the name step: a local draft to continue, or a Workspace whose trial never started. */
const NameStepNotices = ({ onStartOver }: { onStartOver: () => void }): ReactElement | null => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const isSignedIn = useAppSelector(isAuthenticated)
  const isResumeOffered = useAppSelector(selectIsResumeOffered)
  const { draft, ownAddresses } = useWorkspaceDraft()
  const { sizes } = useTrialSizes()
  const { steps, goTo } = useWizardNavigation('name')
  const { currentData: spaces } = useSpacesGetV1Query(undefined, { skip: !isSignedIn })

  const startOver = () => {
    dispatch(resumeOfferAnswered())
    dispatch(clearWorkspaceDraft())
    onStartOver()
  }

  const finishSetup = (spaceId: string) => {
    dispatch(resumeOfferAnswered())
    void router.push(finishSetupRoute(steps, spaceId))
  }

  const continueDraft = () => {
    dispatch(resumeOfferAnswered())
    const target = findFirstInvalidStep(steps, draft, { sizes, ownAddresses }) ?? steps[steps.length - 1]
    goTo(target)
  }

  // Once answered, the offer is gone: the user chose to continue or to start over.
  if (!isResumeOffered) return null

  const unfinishedSetupNotice = (spaceId: string, name: string) => (
    <WizardNotice
      testId="unfinished-setup-notice"
      title={`You have not finished setting up ${name}`}
      primaryLabel="Finish setup"
      onPrimary={() => finishSetup(spaceId)}
      secondaryLabel="Create a new Workspace"
      onSecondary={startOver}
    />
  )

  if (draft.createdSpaceId !== null) {
    // Only the gateway knows whether the trial started after the user left Stripe.
    const created = spaces?.find((space) => space.uuid === draft.createdSpaceId)
    return created?.setupStatus === 'pending' ? unfinishedSetupNotice(draft.createdSpaceId, draft.name) : null
  }

  if (hasContent(draft)) {
    return (
      <WizardNotice
        testId="resume-draft-notice"
        title="Continue where you left off?"
        body={summarizeDraft(draft, getPickedSize(draft, { sizes }))}
        primaryLabel="Continue"
        onPrimary={continueDraft}
        secondaryLabel="Start over"
        onSecondary={startOver}
      />
    )
  }

  const unfinished = spaces?.find((space) => space.setupStatus === 'pending')
  return unfinished ? unfinishedSetupNotice(unfinished.uuid, unfinished.name) : null
}

export default NameStepNotices
