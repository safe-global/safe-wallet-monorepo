import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button'
import EmptyBatch from './EmptyBatch'

const meta = {
  title: 'Features/Batching/EmptyBatch',
  component: EmptyBatch,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyBatch>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default empty state shown in the batch sidebar when no transactions have been
 * added yet. The `children` slot holds the primary call to action, matching how
 * the sidebar wires up its "New transaction" button.
 */
export const Default: Story = {
  args: {
    children: <Button onClick={() => alert('New transaction')}>New transaction</Button>,
  },
}

/**
 * The call to action is disabled, e.g. when no eligible wallet is connected to
 * start a batch.
 */
export const DisabledAction: Story = {
  args: {
    children: (
      <Button disabled onClick={() => alert('New transaction')}>
        New transaction
      </Button>
    ),
  },
}
