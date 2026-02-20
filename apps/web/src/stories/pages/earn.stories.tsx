import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
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
})

const meta = {
  title: 'Pages/Features/Earn',
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

export const Default: Story = {}
