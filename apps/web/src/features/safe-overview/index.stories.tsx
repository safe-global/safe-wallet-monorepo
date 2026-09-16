import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import SafeOverview from './index'

// Populated Safe: balances + queued transactions render the full overview grid.
const populatedSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/home',
  shadcn: true,
})

// Empty Safe: no assets, no queued transactions — exercises the empty states.
const emptySetup = createMockStory({
  scenario: 'empty',
  wallet: 'owner',
  pathname: '/home',
  shadcn: true,
})

const meta = {
  title: 'Features/SafeOverview/SafeOverview',
  component: SafeOverview,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof SafeOverview>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The default overview for a Safe that holds assets and has pending transactions.
 * Renders the account header (balance + actions) and the assets / pending transactions grid.
 */
export const Populated: Story = {
  decorators: [populatedSetup.decorator],
  parameters: {
    ...populatedSetup.parameters,
  },
}

/**
 * The overview for a freshly created Safe with no assets and no queued transactions.
 * Exercises the empty states of the assets and pending transactions widgets.
 */
export const Empty: Story = {
  decorators: [emptySetup.decorator],
  parameters: {
    ...emptySetup.parameters,
  },
}
