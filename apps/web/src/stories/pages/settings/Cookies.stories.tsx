import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import CookiesSettings from '@/pages/settings/cookies'

/**
 * Settings Cookies page - manage cookie preferences.
 * Configure analytics and tracking preferences.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/settings/cookies',
})

const meta = {
  title: 'Pages/Core/Settings/Cookies',
  component: CookiesSettings,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof CookiesSettings>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
