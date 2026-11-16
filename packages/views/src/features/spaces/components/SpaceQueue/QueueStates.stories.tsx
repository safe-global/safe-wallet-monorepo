import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { QueueLoadError, QueueNoMatches } from './QueueStates'

const meta = {
  title: 'Features/Spaces/Transactions/QueueStates',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const NoMatches: Story = {
  render: () => <QueueNoMatches hasFilters isSearching={false} onClear={fn()} />,
}

export const NoSearchMatches: Story = {
  render: () => <QueueNoMatches hasFilters={false} isSearching onClear={fn()} />,
}

export const LoadError: Story = {
  render: () => <QueueLoadError onRetry={fn()} />,
}
