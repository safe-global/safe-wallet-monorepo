import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import SpaceSafeAccounts from '@/pages/spaces/safe-accounts'

/**
 * Space Safe Accounts page - Safes within a Space.
 * View and manage Safes associated with a Space.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  layout: 'fullPage',
  pathname: '/spaces/safe-accounts',
  features: { spaces: true },
  query: { spaceId: '1' },
})

const meta = {
  title: 'Pages/Spaces/SafeAccounts',
  component: SpaceSafeAccounts,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof SpaceSafeAccounts>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
