import type { ReactElement } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  ConflictType,
  DetailedExecutionInfoType,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
} from '@safe-global/store/gateway/types'
import { createMockStory } from '@/stories/mocks'
import { RouterDecorator } from '@/stories/routerDecorator'
import { AppRoutes } from '@/config/routes'
import TransactionQueueBar from './index'

const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'
const SIGNER_ADDRESS = '0x2222222222222222222222222222222222222222'

// Fixed so the rows render absolute dates rather than drifting "N days ago" labels in snapshots.
const TIMESTAMP = Date.UTC(2024, 0, 15, 12, 0, 0)

const makeQueuedTx = (nonce: number): QueuedItemPage['results'][number] => ({
  type: TransactionListItemType.TRANSACTION,
  transaction: {
    id: `multisig_${SAFE_ADDRESS}_0x${nonce.toString(16).padStart(8, '0')}`,
    timestamp: TIMESTAMP + nonce * 60_000,
    txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
    txInfo: {
      type: TransactionInfoType.CUSTOM,
      to: { value: SAFE_ADDRESS },
      dataSize: '0',
      value: '0',
      isCancellation: false,
    },
    executionInfo: {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: [{ value: SIGNER_ADDRESS }],
    },
    txHash: null,
  },
  conflictType: ConflictType.NONE,
})

const makeQueue = (count: number): QueuedItemPage => ({
  results: Array.from({ length: count }, (_, index) => makeQueuedTx(index + 1)),
})

const SHORT_QUEUE = makeQueue(3)
const LONG_QUEUE = makeQueue(30)

/**
 * The bar is `position: absolute; bottom: 0`, so it needs a positioned, full-height host — inside
 * the app that is the Safe App frame wrapper.
 */
const withAppFrame = (Story: () => ReactElement) => (
  <div className="bg-background relative h-dvh w-full overflow-hidden">
    <Story />
  </div>
)

/**
 * `createMockStory`'s `parameters.nextjs.router` only reaches the story inside Storybook; the
 * snapshot tests compose these with `.storybook/preview` alone, where `PaginatedTxns`' `useTxFilter`
 * would find no router. Providing the context explicitly renders the same in both.
 */
const withRouter: Decorator = (Story) => (
  <RouterDecorator
    router={{
      pathname: AppRoutes.apps.open,
      route: AppRoutes.apps.open,
      asPath: AppRoutes.apps.open,
      query: { safe: `eth:${SAFE_ADDRESS}` },
    }}
  >
    <Story />
  </RouterDecorator>
)

/**
 * `PaginatedTxns` reads the first queue page from the store rather than the network, so seeding
 * `txQueue` is what puts real rows in the bar.
 */
const setupWithQueue = (queue: QueuedItemPage) =>
  createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'none',
    store: { txQueue: { data: queue, loading: false, loaded: true } },
  })

const shortQueueSetup = setupWithQueue(SHORT_QUEUE)
const longQueueSetup = setupWithQueue(LONG_QUEUE)

// Decorators live on the stories, not on meta: story-level decorators stack with meta-level ones,
// so a per-story store override would render the frame and providers twice.
const meta = {
  title: 'Components/SafeApps/TransactionQueueBar',
  component: TransactionQueueBar,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    visible: true,
    setExpanded: () => {},
    onDismiss: () => {},
  },
} satisfies Meta<typeof TransactionQueueBar>

export default meta
type Story = StoryObj<typeof meta>

/** Collapsed, the bar is just its 64px header. The chevron points up: it expands upward. */
export const Collapsed: Story = {
  parameters: shortQueueSetup.parameters,
  decorators: [withAppFrame, withRouter, shortQueueSetup.decorator],
  args: {
    expanded: false,
    transactions: SHORT_QUEUE,
  },
}

/** Short enough to fit under the 70vh cap, so the bar sizes to its content. */
export const Expanded: Story = {
  parameters: shortQueueSetup.parameters,
  decorators: [withAppFrame, withRouter, shortQueueSetup.decorator],
  args: {
    expanded: true,
    transactions: SHORT_QUEUE,
  },
}

/**
 * The regression case: a queue taller than the 70vh cap. The rows have to stay inside the bar's
 * own surface and scroll within it — with a visible overflow they render past the background and
 * over the dimmed backdrop.
 */
export const LongQueue: Story = {
  parameters: longQueueSetup.parameters,
  decorators: [withAppFrame, withRouter, longQueueSetup.decorator],
  args: {
    expanded: true,
    transactions: LONG_QUEUE,
  },
}
