import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory, createChainData } from '@/stories/mocks'
import { chainFixtures } from '../../../../../../config/test/msw/fixtures'
import AssetsWidget from './index'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'none',
})

const meta = {
  title: 'Dashboard/AssetsWidget',
  component: AssetsWidget,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof AssetsWidget>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Swap enabled (Send + Swap). Values translated 80px right; hover to reveal buttons.
 */
export const WithSwap: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'none',
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [
      setup.decorator,
      (Story) => (
        <div style={{ padding: 24, overflow: 'hidden' }}>
          <Story />
        </div>
      ),
    ],
  }
})()

/**
 * AssetsWidget with whale portfolio data.
 * Tests large balance rendering.
 */
export const WhalePortfolio: Story = (() => {
  const setup = createMockStory({
    scenario: 'vitalik',
    wallet: 'owner',
    layout: 'none',
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Empty state when Safe has no assets.
 * Shows placeholder message to deposit funds.
 */
export const NoAssets: Story = (() => {
  const setup = createMockStory({
    scenario: 'empty',
    wallet: 'owner',
    layout: 'none',
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
    layout: 'none',
    handlers: [
      http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
      http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [chainData] })),
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
 * Safe Token holder with diverse portfolio (25 tokens).
 */
export const DiversePortfolio: Story = (() => {
  const setup = createMockStory({
    scenario: 'safeTokenHolder',
    wallet: 'owner',
    layout: 'none',
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Swap disabled (Send only). Values translated 44px right; hover to reveal button.
 */
export const WithoutSwap: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'none',
    features: { swaps: false },
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [
      setup.decorator,
      (Story) => (
        <div style={{ padding: 24, overflow: 'hidden' }}>
          <Story />
        </div>
      ),
    ],
  }
})()
