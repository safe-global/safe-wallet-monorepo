import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Overview from './Overview'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  layout: 'paper',
})

const meta = {
  title: 'Dashboard/Overview',
  component: Overview,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Overview>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default Overview widget with no wallet connected.
 * Action buttons may be disabled or show connect prompts.
 */
export const Default: Story = {}

/**
 * Overview with wallet connected as Safe owner.
 * All action buttons (Send, Swap, Receive) are enabled.
 */
export const WalletConnected: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Overview with whale portfolio data (Vitalik's Safe).
 * Tests large balance rendering.
 */
export const WhalePortfolio: Story = (() => {
  const setup = createMockStory({
    scenario: 'vitalik',
    wallet: 'disconnected',
    layout: 'paper',
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Overview with empty balance.
 * Send and Swap buttons are hidden when there are no assets.
 */
export const EmptyBalance: Story = (() => {
  const setup = createMockStory({
    scenario: 'empty',
    wallet: 'disconnected',
    layout: 'paper',
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
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'disconnected',
    layout: 'paper',
    store: {
      safeInfo: {
        data: undefined,
        loading: true,
        loaded: false,
      },
    },
    handlers: [
      http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, async () => {
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
 * Undeployed Safe state.
 * Shows token balance instead of fiat value, no action buttons.
 */
export const UndeployedSafe: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'disconnected',
    layout: 'paper',
    store: {
      safeInfo: {
        data: { deployed: false },
        loading: false,
        loaded: true,
      },
    },
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()
