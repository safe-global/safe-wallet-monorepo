import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import { HistoryComingSoon, QueueEmpty, QueueLoadError, QueueNoMatches, QueueTruncatedNotice } from './QueueStates'

const meta = {
  title: 'Features/Spaces/Transactions/QueueStates',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Always skeletons: the queue shows them until its first answer arrives */
export const Loading: Story = {
  tags: ['skip-visual-test'],
  render: () => <SkeletonTxList />,
}

export const Empty: Story = {
  render: () => <QueueEmpty />,
}

export const LoadError: Story = {
  render: () => <QueueLoadError onRetry={fn()} />,
}

/** Try again is refetching the queue that failed */
export const LoadErrorRetrying: Story = {
  render: () => <QueueLoadError onRetry={fn()} isRetrying />,
}

/** The gateway read only part of the queue */
export const Truncated: Story = {
  render: () => <QueueTruncatedNotice shown={100} total={243} />,
}

export const NoMatches: Story = {
  render: () => <QueueNoMatches hasFilters isSearching={false} onClear={fn()} />,
}

export const NoSearchMatches: Story = {
  render: () => <QueueNoMatches hasFilters={false} isSearching onClear={fn()} />,
}

export const HistoryTab: Story = {
  render: () => <HistoryComingSoon />,
}
