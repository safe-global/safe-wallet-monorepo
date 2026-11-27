import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import { localItem } from '@/services/local-storage/local'
import { SWAPS_CONSENT_STORAGE_KEY } from '@/features/swap/constants'
import Swap from '@/pages/swap'

/**
 * Swap page - token exchange interface.
 * Enables token swaps directly from the Safe.
 * Storybook aliases the CoW Swap widget to a placeholder (.storybook/mocks/cowSwapWidget.tsx).
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/swap',
})

const meta = {
  title: 'Pages/DeFi/Swap',
  component: Swap,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Swap>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  beforeEach: () => localItem(SWAPS_CONSENT_STORAGE_KEY).remove(),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole('button', { name: 'Continue' })
  },
}

export const ConsentAccepted: Story = {
  beforeEach: () => localItem(SWAPS_CONSENT_STORAGE_KEY).set(true),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByTestId('cow-swap-widget-mock')
  },
}
