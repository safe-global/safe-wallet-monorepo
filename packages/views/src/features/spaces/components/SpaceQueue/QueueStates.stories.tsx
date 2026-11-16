import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import SkeletonTxList from '@safe-global/views/components/common/PaginatedTxns/SkeletonTxList'
import { QueueEmpty, QueueLoadError, QueueTruncatedNotice } from './QueueStates'

const meta = {
  title: 'Features/Spaces/SpaceQueue/QueueStates',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  render: () => <SkeletonTxList />,
}

export const Empty: Story = {
  render: () => <QueueEmpty />,
}

export const LoadError: Story = {
  render: () => <QueueLoadError onRetry={fn()} />,
}

/** The gateway read only part of the queue */
export const Truncated: Story = {
  render: () => <QueueTruncatedNotice shown={100} total={243} />,
}
