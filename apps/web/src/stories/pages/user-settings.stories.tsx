import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import UserSettings from '@/pages/user-settings'

/**
 * User Settings page - personal account preferences.
 * Manage wallet connections and personal settings.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
})

const meta = {
  title: 'Pages/Onboarding/UserSettings',
  component: UserSettings,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof UserSettings>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
