import type { Meta, StoryObj } from '@storybook/react'
import { faker } from '@faker-js/faker'
import {
  CheckStatus,
  type PublicCheckStatus,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import { StoreDecorator } from '@/stories/storeDecorator'
import { SafenetQueueStatusView, type SafenetQueueStatusVariant } from './SafenetQueueStatus'
import {
  SAFENET_EXAMPLE_VOTES,
  STORY_SUBMITTED_AT,
  exampleSnapshot,
  inProgressElapsed,
  inProgressWithDeadline,
  rejectedSnapshot,
} from './storyExamples'

faker.seed(456)

const meta: Meta<typeof SafenetQueueStatusView> = {
  title: 'Features/SafenetChecks/SafenetQueueStatus',
  component: SafenetQueueStatusView,
  parameters: { layout: 'centered' },
  decorators: [
    (Story, context) => (
      <StoreDecorator initialState={{}} context={context}>
        <div className="bg-background w-56 rounded-lg p-3">
          <Story />
        </div>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const story = (snapshot: SafenetCheckSnapshot, variant: SafenetQueueStatusVariant, description: string): Story => ({
  args: {
    publicStatus: snapshot.status as Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>,
    snapshot,
    timestampMs: STORY_SUBMITTED_AT,
    variant,
  },
  parameters: { docs: { description: { story: description } } },
})

export const ChipSubmitted = story(exampleSnapshot(CheckStatus.SUBMITTED), 'chip', 'Queue row, SUBMITTED.')
export const ChipInProgress = story(inProgressWithDeadline(), 'chip', 'Queue row, IN_PROGRESS with time left.')
export const ChipInProgressElapsed = story(inProgressElapsed(), 'chip', 'Queue row, IN_PROGRESS elapsed fallback.')
export const ChipBenign = story(exampleSnapshot(CheckStatus.BENIGN), 'chip', 'Queue row, BENIGN.')
export const ChipMaliciousOneRule = story(
  rejectedSnapshot(SAFENET_EXAMPLE_VOTES.settingsChange),
  'chip',
  'Queue row, MALICIOUS, example #1. Hover or read with a screen reader for the rule and count.',
)
export const ChipMaliciousSeveralRules = story(
  rejectedSnapshot(SAFENET_EXAMPLE_VOTES.approvalAndSpender),
  'chip',
  'Queue row, MALICIOUS, example #4.',
)
export const ChipMaliciousUnrecognised = story(
  rejectedSnapshot(SAFENET_EXAMPLE_VOTES.unrecognised),
  'chip',
  'Queue row, MALICIOUS with an illustrative unknown code.',
)
export const ChipTimedOut = story(
  rejectedSnapshot(SAFENET_EXAMPLE_VOTES.openDispute, CheckStatus.TIMED_OUT),
  'chip',
  'Queue row, TIMED_OUT, example #8.',
)

/** The quiet treatment, kept for compact placements. UNAVAILABLE and loading render nothing in the queue. */
export const InlineMalicious = story(rejectedSnapshot(SAFENET_EXAMPLE_VOTES.blocklisted), 'inline', 'Inline variant.')
