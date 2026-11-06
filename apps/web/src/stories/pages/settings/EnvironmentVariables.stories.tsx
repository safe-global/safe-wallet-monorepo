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

const ownTenderlySetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/settings/environment-variables',
  store: {
    settings: {
      env: {
        rpc: {},
        tenderly: {
          url: 'https://api.tenderly.co/api/v1/account/my-org/project/my-project/simulate',
          accessToken: 'tenderly-access-token',
          publicSharing: true,
        },
      },
    },
  },
})

const meta = {
  title: 'Pages/Core/Settings/EnvironmentVariables',
  component: EnvironmentVariables,
  loaders: [mswLoader],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof EnvironmentVariables>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: { ...defaultSetup.parameters },
  decorators: [defaultSetup.decorator],
}

export const OwnTenderlyWithPublicSharing: Story = {
  parameters: { ...ownTenderlySetup.parameters },
  decorators: [ownTenderlySetup.decorator],
}
