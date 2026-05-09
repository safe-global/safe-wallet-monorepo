import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory, createChainData } from '@/stories/mocks'
import { SAFE_ADDRESSES, chainFixtures, safeFixtures } from '../../../../../../config/test/msw/fixtures'
import PendingTxsList from './PendingTxsList'

// Mock transaction data for queue - keep this helper as it's unique to this story
const createMockQueuedTransaction = (nonce: number, confirmations: number, threshold: number) => ({
  type: 'TRANSACTION',
  transaction: {
    id: `multisig_0x${nonce.toString(16).padStart(8, '0')}`,
    timestamp: Date.now() - nonce * 3600000,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: {
      type: 'Transfer',
      sender: { value: SAFE_ADDRESSES.efSafe.address },
      recipient: { value: '0x1234567890123456789012345678901234567890', name: 'Recipient' },
      direction: 'OUTGOING',
      transferInfo: {
        type: 'ERC20',
        tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        tokenName: 'USD Coin',
        tokenSymbol: 'USDC',
        logoUri:
          'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
        decimals: 6,
        value: '1000000000',
      },
    },
    executionInfo: {
      type: 'MULTISIG',
      nonce,
      confirmationsRequired: threshold,
      confirmationsSubmitted: confirmations,
      missingSigners: confirmations < threshold ? [{ value: '0xowner1111111111111111111111111111111111' }] : [],
    },
  },
  conflictType: 'None',
})

const createMockQueueResponse = (txCount: number, confirmations: number = 1, threshold: number = 2) => ({
  count: txCount,
  next: null,
  previous: null,
  results:
    txCount > 0
      ? Array.from({ length: Math.min(txCount, 4) }, (_, i) =>
          createMockQueuedTransaction(i + 1, confirmations, threshold),
        )
      : [],
})

// Create handlers for tx queue
const createTxQueueHandlers = (txCount: number, confirmations: number = 1, threshold: number = 2) => {
  const chainData = createChainData()
  return [
    http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
    http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [chainData] })),
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(safeFixtures.efSafe)),
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/transactions\/queued/, () =>
      HttpResponse.json(createMockQueueResponse(txCount, confirmations, threshold)),
    ),
  ]
}

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'paper',
  store: {
    txQueue: {
      data: createMockQueueResponse(3, 1, 2),
      loading: false,
      error: undefined,
    },
  },
  handlers: createTxQueueHandlers(3, 1, 2),
})

const meta = {
  title: 'Dashboard/PendingTxsList',
  component: PendingTxsList,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
  tags: ['autodocs'],
} satisfies Meta<typeof PendingTxsList>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default view with multiple pending transactions awaiting signatures.
 */
export const Default: Story = {}

/**
 * Single pending transaction awaiting signatures.
 */
export const SingleTransaction: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',
    store: {
      txQueue: {
        data: createMockQueueResponse(1, 1, 2),
        loading: false,
        error: undefined,
      },
    },
    handlers: createTxQueueHandlers(1, 1, 2),
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Multiple pending transactions in the queue.
 * Shows up to 4 transactions with "View all" link.
 */
export const MultipleTransactions: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',
    store: {
      txQueue: {
        data: createMockQueueResponse(4, 1, 2),
        loading: false,
        error: undefined,
      },
    },
    handlers: createTxQueueHandlers(4, 1, 2),
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Empty state when there are no pending transactions.
 * Shows "No transactions to sign" message.
 */
export const EmptyQueue: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',
    store: {
      txQueue: {
        data: createMockQueueResponse(0),
        loading: false,
        error: undefined,
      },
    },
    handlers: createTxQueueHandlers(0),
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Transaction ready to execute (all confirmations gathered).
 */
export const ReadyToExecute: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',
    store: {
      txQueue: {
        data: createMockQueueResponse(2, 2, 2),
        loading: false,
        error: undefined,
      },
    },
    handlers: createTxQueueHandlers(2, 2, 2),
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Loading state showing skeleton placeholder.
 */
export const Loading: Story = (() => {
  const chainData = createChainData()
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',
    store: {
      safeInfo: {
        data: undefined,
        loading: true,
        loaded: false,
      },
      txQueue: {
        data: undefined,
        loading: true,
        error: undefined,
      },
    },
    handlers: [
      http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
      http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [chainData] })),
      http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(safeFixtures.efSafe)),
      http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/transactions\/queued/, async () => {
        await new Promise(() => {})
        return HttpResponse.json({})
      }),
    ],
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Connected as non-owner - shows all pending transactions
 * without filtering to actionable ones.
 */
export const NonOwnerView: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'nonOwner',
    layout: 'paper',
    store: {
      txQueue: {
        data: createMockQueueResponse(3, 1, 2),
        loading: false,
        error: undefined,
      },
    },
    handlers: createTxQueueHandlers(3, 1, 2),
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()
