import type { Meta, StoryObj } from '@storybook/react'
import { faker } from '@faker-js/faker'
import {
  CheckStatus,
  type PublicCheckStatus,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import { StoreDecorator } from '@/stories/storeDecorator'
import { AuditLog, AuditLogHeader, AuditRow } from '@/components/common/AuditLog'
import { SafenetAuditRowView } from './SafenetAuditRow'
import {
  SAFENET_EXAMPLE_VOTES,
  STORY_CHAIN_ID,
  STORY_SAFE_TX_HASH,
  STORY_SUBMITTED_AT,
  exampleSnapshot,
  inProgressWithDeadline,
  rejectedSnapshot,
} from './storyExamples'

faker.seed(456)

const OWNER = '0x1234567890123456789012345678901234567890'

const meta: Meta<typeof SafenetAuditRowView> = {
  title: 'Features/SafenetChecks/SafenetAuditRow',
  component: SafenetAuditRowView,
  parameters: { layout: 'centered' },
  decorators: [
    (Story, context) => (
      <StoreDecorator initialState={{}} context={context}>
        <div className="bg-card w-[454px] rounded-lg p-4">
          <AuditLog>
            <AuditLogHeader />
            <AuditRow label="Created" actionType="created" address={OWNER} timestamp={STORY_SUBMITTED_AT} />
            <AuditRow label="Signed (1/2)" actionType="signed" address={OWNER} timestamp={STORY_SUBMITTED_AT} />
            <Story />
          </AuditLog>
        </div>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const story = (snapshot: SafenetCheckSnapshot, description: string): Story => ({
  args: {
    publicStatus: snapshot.status as Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>,
    snapshot,
    safeTxHash: STORY_SAFE_TX_HASH,
    chainId: STORY_CHAIN_ID,
    timestampMs: STORY_SUBMITTED_AT,
    isLast: true,
  },
  parameters: { docs: { description: { story: description } } },
})

export const Submitted = story(exampleSnapshot(CheckStatus.SUBMITTED), 'SUBMITTED.')
export const InProgress = story(inProgressWithDeadline(), 'IN_PROGRESS with time left.')
export const Benign = story(exampleSnapshot(CheckStatus.BENIGN), 'BENIGN, verified: "Safenet" links the attestation.')
export const MaliciousOneRule = story(
  rejectedSnapshot(SAFENET_EXAMPLE_VOTES.settingsChange),
  'MALICIOUS, example #1: the rule is in the label, "Safenet" links the explorer.',
)
export const MaliciousSeveralRules = story(
  rejectedSnapshot(SAFENET_EXAMPLE_VOTES.delegateCallAndSettings),
  'MALICIOUS, example #2: several rules keep the generic label; full detail is in the Copilot section.',
)
export const MaliciousUnrecognised = story(
  rejectedSnapshot(SAFENET_EXAMPLE_VOTES.unrecognised),
  'MALICIOUS with an illustrative unknown code.',
)
export const TimedOut = story(
  rejectedSnapshot(SAFENET_EXAMPLE_VOTES.openDispute, CheckStatus.TIMED_OUT),
  'TIMED_OUT, example #8. Loading and UNAVAILABLE render no row.',
)
