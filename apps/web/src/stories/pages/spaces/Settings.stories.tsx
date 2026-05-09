import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import SpaceSettings from '@/pages/spaces/settings'

/**
 * Space Settings page - configure Space options.
 * Manage Space name, description, and preferences.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  layout: 'fullPage',
  pathname: '/spaces/settings',
  features: { spaces: true },
  query: { spaceId: '1' },
})

const meta = {
  title: 'Pages/Spaces/Settings',
  component: SpaceSettings,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof SpaceSettings>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
