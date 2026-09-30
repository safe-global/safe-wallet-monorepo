import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import NavigateToSection from './NavigateToSection'

// Safe-level route with a connected owner wallet — every action item is enabled.
const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
})

// Same route but no wallet connected — the "Send" item becomes disabled.
const disconnectedSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  shadcn: true,
})

const meta = {
  title: 'Features/GlobalSearch/NavigateToSection',
  component: NavigateToSection,
  loaders: [mswLoader],
  decorators: [defaultSetup.decorator],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
  args: {
    label: 'Navigate to',
    query: '',
  },
} satisfies Meta<typeof NavigateToSection>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Safe-level route with a connected owner wallet and swaps enabled.
 * Renders the full navigation list: Send, Swap, Transaction builder and Assets.
 */
export const Default: Story = {}

/**
 * No wallet connected — the "Send" item is rendered in its disabled state
 * (dimmed and non-interactive) while the remaining items stay enabled.
 */
export const Disconnected: Story = {
  decorators: [disconnectedSetup.decorator],
  parameters: {
    ...disconnectedSetup.parameters,
  },
}

/**
 * A search query narrows the list down to the matching items. Here the query
 * "trans" keeps only "Transaction builder".
 */
export const FilteredQuery: Story = {
  args: {
    query: 'trans',
  },
}
