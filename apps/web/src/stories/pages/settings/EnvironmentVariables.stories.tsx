import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import EnvironmentVariables from '@/pages/settings/environment-variables'

/**
 * Settings Environment Variables page - configure custom endpoints.
 * Override default RPC and service URLs.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/settings/environment-variables',
})

const meta = {
  title: 'Pages/Core/Settings/EnvironmentVariables',
  component: EnvironmentVariables,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof EnvironmentVariables>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
