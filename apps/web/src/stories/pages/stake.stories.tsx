import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Stake from '@/pages/stake'

/**
 * Stake page - native staking interface.
 * Allows users to stake ETH directly from their Safe.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/stake',
})

const meta = {
  title: 'Pages/Features/Stake',
  component: Stake,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Stake>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
