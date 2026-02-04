import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Spaces from '@/pages/welcome/spaces'

/**
 * Spaces List page - displays user's Spaces.
 * Shows collaborative spaces the user belongs to.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  features: { spaces: true },
})

const meta = {
  title: 'Pages/Onboarding/SpacesList',
  component: Spaces,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Spaces>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
