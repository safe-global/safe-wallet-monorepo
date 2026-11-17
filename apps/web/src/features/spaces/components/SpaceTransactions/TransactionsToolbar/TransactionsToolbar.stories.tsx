import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import type { SpaceQueueCounts } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { createMockStory } from '@/stories/mocks'
import { NO_SPACE_QUEUE_FILTERS } from '../../../store/spaceQueueApi'
import TransactionsToolbar from './TransactionsToolbar'

const SAFE_A = '0x2222222222222222222222222222222222222222'
const SAFE_B = '0x1111111111111111111111111111111111111111'
const SIGNER_A = '0x3333333333333333333333333333333333333333'
const SIGNER_B = '0x4444444444444444444444444444444444444444'

const COUNTS: SpaceQueueCounts = {
  total: 19,
  execute: 1,
  sign: 10,
  blocked: 7,
  waiting: 1,
  conflicting: 2,
  stale: 0,
  safes: [
    { chainId: '1', safeAddress: SAFE_A, count: 8 },
    { chainId: '1', safeAddress: SAFE_B, count: 4 },
    { chainId: '100', safeAddress: SAFE_B, count: 7 },
  ],
  chains: [
    { chainId: '1', count: 12 },
    { chainId: '100', count: 7 },
  ],
  signers: [
    { address: SIGNER_A, count: 10 },
    { address: SIGNER_B, count: 3 },
  ],
}

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', layout: 'paper', shadcn: true })

const meta = {
  title: 'Features/Spaces/Transactions/TransactionsToolbar',
  component: TransactionsToolbar,
  args: {
    spaceId: '1',
    counts: COUNTS,
    filters: NO_SPACE_QUEUE_FILTERS,
    onFiltersChange: fn(),
  },
  parameters: { ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta<typeof TransactionsToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Every filter in use: one chip per filter, naming two values and counting the rest. */
export const Filtered: Story = {
  args: {
    filters: {
      statuses: ['sign', 'execute', 'blocked', 'conflicting'],
      safes: [{ chainId: '1', safeAddress: SAFE_A }],
      chainIds: ['1', '100'],
      signers: [SIGNER_A],
    },
  },
}
