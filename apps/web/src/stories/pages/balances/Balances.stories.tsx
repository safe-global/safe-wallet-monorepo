import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Balances from '@/pages/balances'

/**
 * Balances page - displays the user's token balances.
 * Includes total asset value, token list, and currency selection.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/balances',
})

const meta = {
  title: 'Pages/Core/Balances',
  component: Balances,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Balances>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
