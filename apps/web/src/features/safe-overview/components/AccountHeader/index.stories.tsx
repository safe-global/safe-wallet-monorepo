import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import AccountHeader from './index'

// Populated Safe: balances resolve to a non-zero fiat total, so the header shows
// the total value plus the full action tray (Send / Swap / Receive / Build).
const populatedSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/home',
  shadcn: true,
})

// Empty Safe: no assets — the total value renders as the empty/zero state and the
// asset-dependent actions (Send / Swap) are hidden.
const emptySetup = createMockStory({
  scenario: 'empty',
  wallet: 'owner',
  pathname: '/home',
  shadcn: true,
})

const meta = {
  title: 'Features/SafeOverview/AccountHeader',
  component: AccountHeader,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof AccountHeader>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The default account header for a Safe that holds assets. Shows the aggregated
 * total value alongside the primary actions and the "Manage Safe" button.
 */
export const Populated: Story = {
  decorators: [populatedSetup.decorator],
  parameters: {
    ...populatedSetup.parameters,
  },
}

/**
 * A freshly created Safe with no assets. The total value shows its empty state and
 * the asset-dependent Send / Swap actions are hidden, while Receive and Build remain.
 */
export const Empty: Story = {
  decorators: [emptySetup.decorator],
  parameters: {
    ...emptySetup.parameters,
  },
}
