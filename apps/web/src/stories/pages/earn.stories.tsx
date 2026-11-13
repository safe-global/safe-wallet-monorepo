import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import { localItem } from '@/services/local-storage/local'
import { EARN_CONSENT_STORAGE_KEY, hideEarnInfoStorageKey } from '@/features/earn/constants'
import Earn from '@/pages/earn'

/**
 * Earn page - DeFi yield opportunities.
 * Shows staking and earning opportunities for Safe assets.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/earn',
  features: { earn: true },
})

const meta = {
  title: 'Pages/DeFi/Earn',
  component: Earn,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Earn>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  beforeEach: () => localItem(EARN_CONSENT_STORAGE_KEY).remove(),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole('button', { name: 'Continue' })
  },
}

export const ConsentAccepted: Story = {
  beforeEach: () => {
    localItem(EARN_CONSENT_STORAGE_KEY).set(true)
    localItem(hideEarnInfoStorageKey).remove()
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole('button', { name: 'Get started' })
  },
}

export const NotAvailable: Story = {
  parameters: createMockStory({ scenario: 'efSafe', pathname: '/earn' }).parameters,
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Earn is not available on this network.')
  },
}
