import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { createMockStory } from '@/stories/mocks'
import PendingTxList from './index'

// Default harness: the `efSafe` scenario preloads the tx queue slice with three
// pending multisig transactions (a transfer awaiting signatures, a native-coin
// transfer, and a settings change awaiting execution), so the widget renders its
// populated state without any extra wiring.
const populatedSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  pathname: '/home',
  shadcn: true,
})

// Empty state: override the tx queue slice with an empty page so the widget shows
// its "No pending transactions" message instead of the default fixtures.
const emptyQueue: QueuedItemPage = {
  count: 0,
  next: null,
  previous: null,
  results: [],
}

const emptySetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  pathname: '/home',
  shadcn: true,
  store: {
    txQueue: { data: emptyQueue, loading: false, loaded: true },
  },
})

// Loading state: mark the tx queue slice as loading so the widget renders its
// skeleton rows.
const loadingSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  pathname: '/home',
  shadcn: true,
  store: {
    txQueue: { data: undefined, loading: true, loaded: false },
  },
})

const meta = {
  title: 'Features/Transactions/PendingTxList',
  component: PendingTxList,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PendingTxList>

export default meta

type Story = StoryObj<typeof meta>

export const Populated: Story = {
  decorators: [populatedSetup.decorator],
  parameters: populatedSetup.parameters,
}

export const Empty: Story = {
  decorators: [emptySetup.decorator],
  parameters: emptySetup.parameters,
}

export const Loading: Story = {
  decorators: [loadingSetup.decorator],
  parameters: loadingSetup.parameters,
}
