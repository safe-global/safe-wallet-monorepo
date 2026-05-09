import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Notifications from '@/pages/settings/notifications'

/**
 * Settings Notifications page - configure alert preferences.
 * Manage push notifications and email alerts.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/settings/notifications',
})

const meta = {
  title: 'Pages/Core/Settings/Notifications',
  component: Notifications,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Notifications>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
