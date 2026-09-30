import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import { RecoveryInProgressCard } from './RecoveryInProgressCard'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  shadcn: true,
})

const DAY_IN_SECONDS = 24 * 60 * 60

const createRecoveryQueueItem = (validFrom: bigint, expiresAt: bigint | null): RecoveryQueueItem => {
  const queueItem = {
    address: '0xd54895B1121A2eE3f37b502F507631FA1331BED6',
    transactionHash: '0x6f465f9d996728a4c34e8fb0e767bb87f884f5901f26fa933f60a4d40b0bbe7d',
    timestamp: BigInt(Date.now()),
    validFrom,
    expiresAt,
    isMalicious: false,
    executor: '0x8b2f79E2A9e9C61c71E5EE9152dEA9A05b23e340',
    args: {
      queueNonce: BigInt(0),
      txHash: '0x6f465f9d996728a4c34e8fb0e767bb87f884f5901f26fa933f60a4d40b0bbe7d',
      to: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
      value: BigInt(0),
      operation: BigInt(0),
      data: '0x',
    },
  }

  return queueItem as unknown as RecoveryQueueItem
}

const meta = {
  title: 'Features/Recovery/RecoveryInProgressCard',
  component: RecoveryInProgressCard,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
} satisfies Meta<typeof RecoveryInProgressCard>

export default meta

type Story = StoryObj<typeof meta>

export const InProgress: Story = {
  args: {
    orientation: 'vertical',
    onClose: () => {},
    recovery: createRecoveryQueueItem(BigInt(Date.now() + 2 * DAY_IN_SECONDS * 1_000), null),
  },
}

export const Executable: Story = {
  args: {
    orientation: 'vertical',
    onClose: () => {},
    recovery: createRecoveryQueueItem(BigInt(Date.now() - DAY_IN_SECONDS * 1_000), null),
  },
}

export const Expired: Story = {
  args: {
    orientation: 'vertical',
    onClose: () => {},
    recovery: createRecoveryQueueItem(
      BigInt(Date.now() - 2 * DAY_IN_SECONDS * 1_000),
      BigInt(Date.now() - DAY_IN_SECONDS * 1_000),
    ),
  },
}

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    recovery: createRecoveryQueueItem(BigInt(Date.now() + 2 * DAY_IN_SECONDS * 1_000), null),
  },
}
