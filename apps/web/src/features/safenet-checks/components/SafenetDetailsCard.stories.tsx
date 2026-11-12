import type { Meta, StoryObj } from '@storybook/react'
import { faker } from '@faker-js/faker'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { createMockStory } from '@/stories/mocks'
import { safenetChainsHandler } from '@/stories/pages/safenet/safenetChainMocks'
import { SafenetDetailsCardView } from './SafenetDetailsCard'
import {
  SAFENET_EXAMPLE_VOTES,
  STORY_CHAIN_ID,
  STORY_SAFE_TX_HASH,
  STORY_SUBMITTED_AT,
  exampleSnapshot,
  inProgressWithDeadline,
  openDisputeSnapshot,
  rejectedSnapshot,
  timedOutDisputeSnapshot,
} from './storyExamples'

faker.seed(456)

const setup = createMockStory()

const meta: Meta<typeof SafenetDetailsCardView> = {
  title: 'Features/SafenetChecks/SafenetDetailsCard',
  component: SafenetDetailsCardView,
  parameters: {
    layout: 'centered',
    ...setup.parameters,
    msw: { handlers: [safenetChainsHandler(), ...setup.parameters.msw.handlers] },
  },
  args: {
    safeTxHash: STORY_SAFE_TX_HASH,
    chainId: STORY_CHAIN_ID,
    timestampMs: STORY_SUBMITTED_AT,
    defaultExpanded: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[560px]">
        <Story />
      </div>
    ),
    setup.decorator,
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Collapsed: Story = {
  args: { publicStatus: CheckStatus.BENIGN, snapshot: exampleSnapshot(CheckStatus.BENIGN), defaultExpanded: false },
}

export const Simulating: Story = {
  args: { publicStatus: CheckStatus.IN_PROGRESS, snapshot: inProgressWithDeadline() },
  tags: ['skip-visual-test'],
}

export const NoIssuesFound: Story = {
  args: { publicStatus: CheckStatus.BENIGN, snapshot: exampleSnapshot(CheckStatus.BENIGN) },
}

export const RiskDetected: Story = {
  args: { publicStatus: CheckStatus.MALICIOUS, snapshot: rejectedSnapshot(SAFENET_EXAMPLE_VOTES.approvalAndSpender) },
}

export const UnderReview: Story = {
  args: { publicStatus: CheckStatus.DISPUTED, snapshot: openDisputeSnapshot() },
}

export const CheckFailed: Story = {
  args: { publicStatus: CheckStatus.TIMED_OUT, snapshot: timedOutDisputeSnapshot() },
}
