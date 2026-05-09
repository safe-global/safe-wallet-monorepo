import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import SafeAppsPermissions from '@/pages/settings/safe-apps'

/**
 * Settings Safe Apps page - manage Safe Apps permissions.
 * Configure which Safe Apps have access to your Safe.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/settings/safe-apps',
})

const meta = {
  title: 'Pages/Core/Settings/SafeApps',
  component: SafeAppsPermissions,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof SafeAppsPermissions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
