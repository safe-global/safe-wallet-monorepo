import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import Accounts from '@/pages/welcome/accounts'

/**
 * My Accounts page - displays all user's Safe Accounts.
 * Shows a list of Safes the user has access to across networks.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
})

const meta = {
  title: 'Pages/Onboarding/MyAccounts',
  component: Accounts,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof Accounts>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
