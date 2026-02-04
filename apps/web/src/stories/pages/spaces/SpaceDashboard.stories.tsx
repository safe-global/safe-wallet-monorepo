import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import SpaceDashboard from '@/pages/spaces'

/**
 * Space Dashboard page - overview of a Space.
 * Shows Space summary, recent activity, and quick actions.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  layout: 'fullPage',
  pathname: '/spaces',
  features: { spaces: true },
  query: { spaceId: '1' },
})

const meta = {
  title: 'Pages/Spaces/Dashboard',
  component: SpaceDashboard,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof SpaceDashboard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
