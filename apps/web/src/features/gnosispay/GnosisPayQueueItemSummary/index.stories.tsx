import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { GnosisPayQueueItemSummary } from './index'
import type { GnosisPayTxItem } from '../types'

const setup = createMockStory({ scenario: 'efSafe', wallet: 'disconnected', layout: 'paper' })
const meta = {
  title: 'Features/GnosisPay/GnosisPayQueueItemSummary',
  component: GnosisPayQueueItemSummary,
  parameters: { ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta<typeof GnosisPayQueueItemSummary>

export default meta
type Story = StoryObj<typeof meta>

const item = (queueNonce: number, executableAt: number, expiresAt: number | null): GnosisPayTxItem => ({
  queueNonce,
  txData: { to: '0x0000000000000000000000000000000000000001', value: '0', data: '0x' },
  executableAt,
  expiresAt,
})

export const QueueStates: Story = {
  args: { item: item(1, 0, null) },
  render: () => {
    const now = Date.now()
    return (
      <div className="space-y-4">
        <GnosisPayQueueItemSummary item={item(1, now + 180_000, now + 1_800_000)} />
        <GnosisPayQueueItemSummary item={item(2, now - 60_000, null)} />
        <GnosisPayQueueItemSummary item={item(3, now - 1_800_000, now - 60_000)} />
      </div>
    )
  },
}
