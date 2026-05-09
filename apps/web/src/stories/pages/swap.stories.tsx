import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Swap from '@/pages/swap'

/**
 * Swap page - token exchange interface.
 * Enables token swaps directly from the Safe.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/swap',
})

const meta = {
  title: 'Pages/Features/Swap',
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

export const Default: Story = {}
