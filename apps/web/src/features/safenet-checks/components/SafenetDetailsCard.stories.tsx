import type { Meta, StoryObj } from '@storybook/react'
import { faker } from '@faker-js/faker'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { StoreDecorator } from '@/stories/storeDecorator'
import { SafenetDetailsCardView } from './SafenetDetailsCard'
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

const meta: Meta<typeof SafenetDetailsCardView> = {
  title: 'Features/SafenetChecks/SafenetDetailsCard',
  component: SafenetDetailsCardView,
  parameters: { layout: 'centered' },
  args: {
    safeTxHash: STORY_SAFE_TX_HASH,
    chainId: STORY_CHAIN_ID,
    timestampMs: STORY_SUBMITTED_AT,
    defaultExpanded: true,
  },
  decorators: [
    (Story, context) => (
      <StoreDecorator initialState={{}} context={context}>
        <div className="w-[560px]">
          <Story />
        </div>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Collapsed: Story = {
  args: { publicStatus: CheckStatus.BENIGN, snapshot: exampleSnapshot(CheckStatus.BENIGN), defaultExpanded: false },
}

export const Submitted: Story = {
  args: { publicStatus: CheckStatus.SUBMITTED, snapshot: exampleSnapshot(CheckStatus.SUBMITTED) },
}

export const Simulating: Story = {
  args: { publicStatus: CheckStatus.IN_PROGRESS, snapshot: inProgressWithDeadline() },
}

export const NoIssuesFound: Story = {
  args: { publicStatus: CheckStatus.BENIGN, snapshot: exampleSnapshot(CheckStatus.BENIGN) },
}

/** Example #4: sentinels disagree on the rule. */
export const RiskDetected: Story = {
  args: {
    publicStatus: CheckStatus.MALICIOUS,
    snapshot: rejectedSnapshot(SAFENET_EXAMPLE_VOTES.approvalAndSpender),
  },
}

/** Settings change plus delegate call — multiple rows in one inset panel. */
export const RiskDetectedSeveralRules: Story = {
  args: {
    publicStatus: CheckStatus.MALICIOUS,
    snapshot: rejectedSnapshot(SAFENET_EXAMPLE_VOTES.delegateCallAndSettings),
  },
}

/** Example #8: a split vote with no ruling in time. */
export const CheckFailed: Story = {
  args: {
    publicStatus: CheckStatus.TIMED_OUT,
    snapshot: rejectedSnapshot(SAFENET_EXAMPLE_VOTES.openDispute, CheckStatus.TIMED_OUT),
  },
}
