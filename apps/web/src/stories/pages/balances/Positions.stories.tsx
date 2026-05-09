import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Positions from '@/pages/balances/positions'

/**
 * DeFi Positions page - displays the user's DeFi positions.
 * Shows staking, lending, and other DeFi protocol positions.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/balances/positions',
})

const meta = {
  title: 'Pages/Core/Balances/Positions',
  component: Positions,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Positions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
