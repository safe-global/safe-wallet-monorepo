import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Bridge from '@/pages/bridge'

/**
 * Bridge page - cross-chain asset transfers.
 * Enables users to move assets between different blockchain networks.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/bridge',
})

const meta = {
  title: 'Pages/Features/Bridge',
  component: Bridge,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Bridge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
