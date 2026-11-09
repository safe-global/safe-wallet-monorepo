import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import type { MockStoryConfig } from '@/stories/mocks/types'
import Spaces from '@/pages/welcome/spaces'

/**
 * Spaces List page - displays user's Spaces.
 * Shows collaborative spaces the user belongs to.
 */

const meta = {
  title: 'Pages/Onboarding/SpacesList',
  component: Spaces,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Spaces>

export default meta
type Story = StoryObj<typeof meta>

const spacesStory = (config: MockStoryConfig): Story => {
  const setup = createMockStory({
    scenario: 'efSafe',
    pathname: '/welcome/spaces',
    features: { spaces: true },
    layout: 'fullPage',
    ...config,
  })
  return { parameters: { ...setup.parameters }, decorators: [setup.decorator] }
}

export const Default: Story = spacesStory({ wallet: 'connected' })

export const SignedOut: Story = {
  ...spacesStory({ wallet: 'disconnected', authenticated: false }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Sign in to your Workspace')
  },
}
