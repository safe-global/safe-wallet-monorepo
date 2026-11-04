import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { AuditLog, AuditLogHeader, AuditRow } from '@/components/common/AuditLog'
import { SafenetUnavailableAuditRowView } from './SafenetAuditRow'
import { SafenetUnavailableCardView } from './SafenetDetailsCard'
import { STORY_CHAIN_ID, STORY_SAFE_TX_HASH, STORY_SUBMITTED_AT } from './storyExamples'

const OWNER = '0x1234567890123456789012345678901234567890'

const setup = createMockStory()

const meta: Meta<typeof SafenetUnavailableCardView> = {
  title: 'Features/SafenetChecks/SafenetUnavailable',
  component: SafenetUnavailableCardView,
  parameters: { layout: 'centered', ...setup.parameters },
  args: {
    reason: 'READ_FAILED',
    safeTxHash: STORY_SAFE_TX_HASH,
    chainId: STORY_CHAIN_ID,
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

export const ReadFailed: Story = {}

export const Collapsed: Story = {
  args: { defaultExpanded: false },
}

export const AuditStepReadFailed: Story = {
  render: ({ reason }) => (
    <div className="bg-card w-[454px] rounded-lg p-4">
      <AuditLog>
        <AuditLogHeader />
        <AuditRow label="Created" actionType="created" address={OWNER} timestamp={STORY_SUBMITTED_AT} />
        <SafenetUnavailableAuditRowView reason={reason} isLast />
      </AuditLog>
    </div>
  ),
}
